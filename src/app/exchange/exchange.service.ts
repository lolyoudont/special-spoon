import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { OpenPositionDto } from './dto/openPosition.dto';
import { ClientEntity } from './entities/client.entity';
import { AssetEntity } from './entities/asset.entity';
import { RAYDIUM_SERVICE } from '../dex/dex.module';
import { IDexService } from '../dex/dex.interface';
import Big from 'big.js';
import { ClientBalanceEntity } from './entities/clientBalance.entity';
import { PlatformBalanceEntity } from './entities/platformBalance.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PositionResponse } from './response/position.response';
import { ClosePositionDto } from './dto/closePosition.dto';
import { lockTables } from '../common/utils';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
    @Inject(RAYDIUM_SERVICE)
    private readonly dexService: IDexService,
  ) {}

  async getOpenPosition(
    manager: EntityManager | undefined,
    asset_id: string,
    client_id: string,
    position_type: 'long' | 'short',
  ): Promise<PositionResponse> {
    if (!manager) manager = this.ds.manager;
    const result = await manager
      .createQueryBuilder(TransactionEntity, 'tx')
      .select(
        `SUM(
          CASE WHEN tx.transaction_type = 'open_position' THEN
            tx.amount_token
          ELSE
            -tx.amount_token
          END
        )`,
        'amount_token',
      )
      .addSelect(
        `SUM(
          CASE WHEN tx.transaction_type = 'open_position' THEN
            tx.amount_sol
          ELSE
            -tx.amount_sol
          END
        )`,
        'amount_sol',
      )
      .where('tx.asset_id = :asset_id', { asset_id })
      .andWhere('tx.client_id = :client_id', { client_id })
      .andWhere('tx.position_type = :position_type', { position_type })
      .getRawOne();
    if (!result) {
      throw new InternalServerErrorException(
        `Couldn't retreive open position data!`,
      );
    }
    return result;
  }

  openLongPosition({ asset_id, client_id, amount_token }: OpenPositionDto) {
    // TODO: locking
    return this.ds.transaction(async manager => {
      const clientRepo = manager.getRepository(ClientEntity);
      const assetRepo = manager.getRepository(AssetEntity);
      const clientBalanceRepo = manager.getRepository(ClientBalanceEntity);
      const platformBalanceRepo = manager.getRepository(PlatformBalanceEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      // Retrieve entities from db
      const client = await clientRepo.findOneOrFail({
        where: { client_id },
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });
      const asset = await assetRepo.findOneOrFail({
        where: { asset_id },
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });
      const clientBalance = await clientBalanceRepo.findOne({
        where: { asset_id, client_id },
        // Lock table row
        lock: {
          mode: 'pessimistic_write',
        },
      });
      const platformBalance = await platformBalanceRepo.findOne({
        where: {},
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });

      // Estimate SOL amount and check
      const tokenAmount = new Big(amount_token);

      const estSolAmount = await this.dexService.estimateSolAmount(
        asset.contract_address,
        tokenAmount,
      );
      if (estSolAmount.gt(client.balance_sol)) {
        throw new BadRequestException('Insufficient amount!');
      }

      // Purchase tokens on DEX
      const result = await this.dexService.purchaseTokens(
        asset.contract_address,
        estSolAmount,
      );

      // Update client SOL balance
      await clientRepo.save({
        ...client,
        balance_sol: client.balance_sol.minus(estSolAmount),
      });

      // Update client token balance
      await clientBalanceRepo.save({
        asset_id,
        client_id,
        balance_tokens: clientBalance
          ? clientBalance.balance_tokens.plus(tokenAmount)
          : tokenAmount,
      });

      // Update platform SOL balance
      if (platformBalance) {
        await platformBalanceRepo.save({
          ...platformBalance,
          balance_sol: platformBalance.balance_sol.minus(estSolAmount),
        });
      } else {
        throw new BadRequestException('Insufficient platform balance!');
      }

      // Update platform token balance
      await assetRepo.save({
        ...asset,
        platform_balance: asset.platform_balance.plus(tokenAmount),
      });

      // Insert transaction
      const tx = await transactionRepo.save({
        amount_sol: estSolAmount,
        amount_token: tokenAmount,
        asset_id,
        client_id,
        position_type: 'long',
        transaction_type: 'open_position',
        status: 'pending',
        transaction_id: result.transactionId,
      });

      return transactionRepo.findOneBy({ transaction_id: tx.transaction_id });
    });
  }

  closeLongPosition({ asset_id, client_id, amount_token }: ClosePositionDto) {
    // TODO: locking
    return this.ds.transaction(async manager => {
      const clientRepo = manager.getRepository(ClientEntity);
      const assetRepo = manager.getRepository(AssetEntity);
      const clientBalanceRepo = manager.getRepository(ClientBalanceEntity);
      const platformBalanceRepo = manager.getRepository(PlatformBalanceEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      // Retrieve entities from db
      const client = await clientRepo.findOneOrFail({
        where: { client_id },
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });
      const asset = await assetRepo.findOneOrFail({
        where: { asset_id },
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });
      const clientBalance = await clientBalanceRepo.findOne({
        where: { asset_id, client_id },
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });
      const platformBalance = await platformBalanceRepo.findOne({
        where: {},
        // Lock table row
        lock: { mode: 'pessimistic_write' },
      });

      // Check if position opened >= amount to close
      const amountToClose = new Big(amount_token);
      const openPosition = await this.getOpenPosition(
        manager,
        asset_id,
        client_id,
        'long',
      );
      if (amountToClose.gt(openPosition.amount_token)) {
        throw new BadRequestException('Requested amount exeeds open position!');
      }

      // Estimate SOL amount received and pnl
      const estSolAmount = await this.dexService.estimateSolAmount(
        asset.contract_address,
        amountToClose,
      );
      const averageRate = new Big(openPosition.amount_sol).div(
        openPosition.amount_token,
      );
      const solSpent = averageRate.mul(amountToClose);
      const pnl = estSolAmount.minus(solSpent);

      // Sell tokens via DEX
      const result = await this.dexService.sellTokens(
        asset.contract_address,
        amountToClose,
      );

      // Update client SOL balance
      await clientRepo.save({
        ...client,
        balance_sol: client.balance_sol.plus(estSolAmount),
      });

      // Update client token balance
      await clientBalanceRepo.save({
        asset_id,
        client_id,
        balance_tokens: clientBalance
          ? clientBalance.balance_tokens.minus(amountToClose)
          : amountToClose,
      });

      // Update platform SOL balance
      if (platformBalance) {
        await platformBalanceRepo.save({
          ...platformBalance,
          balance_sol: platformBalance.balance_sol.minus(estSolAmount),
        });
      } else {
        throw new BadRequestException('Insufficient platform balance!');
      }

      // Update platform token balance
      await assetRepo.save({
        ...asset,
        platform_balance: asset.platform_balance.minus(amountToClose),
      });

      // Insert transaction
      const tx = await transactionRepo.save({
        amount_sol: estSolAmount,
        amount_token: amountToClose,
        asset_id,
        client_id,
        position_type: 'long',
        transaction_type: 'close_position',
        status: 'pending',
        transaction_id: result.transactionId,
      });

      return transactionRepo.findOneBy({ transaction_id: tx.transaction_id });
    });
  }
}
