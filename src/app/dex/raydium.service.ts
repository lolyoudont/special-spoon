import { BadRequestException, Injectable } from '@nestjs/common';
import { IDexService, PurchaseResult, SellResult } from './dex.interface';
import Big from 'big.js';
import RaydiumSwap from '../../misc/RaydiumSwap';
import { apiUrl, walletSecretKey } from '../../config';
import { VersionedTransaction } from '@solana/web3.js';

@Injectable()
export class RaydiumService implements IDexService {
  private readonly solMint = 'So11111111111111111111111111111111111111112';
  private readonly swap: RaydiumSwap;

  constructor() {
    this.swap = new RaydiumSwap(apiUrl, walletSecretKey);
  }

  async estimateSolAmount(token: string, amount: Big): Promise<Big> {
    const poolInfo = await this.swap.findRaydiumPoolInfo(this.solMint, token);
    if (!poolInfo) {
      throw new BadRequestException(`Couldn't find pool info for token pair!`);
    }
    const result = await this.swap.calcAmountOut(
      poolInfo,
      amount.toNumber(),
      undefined,
      false,
    );

    return new Big(result.amountIn.toFixed());
  }

  async purchaseTokens(token: string, amount: Big): Promise<PurchaseResult> {
    const poolInfo = await this.swap.findRaydiumPoolInfo(this.solMint, token);
    if (!poolInfo) {
      throw new BadRequestException(`Couldn't find pool info for token pair!`);
    }

    const tx = await this.swap.getSwapTransaction(
      token,
      amount.toNumber(),
      poolInfo,
      undefined,
      true,
      'in',
    );
    const result = await this.swap.sendVersionedTransaction(
      tx as VersionedTransaction,
    );

    return {
      transactionId: result,
    };
  }

  async sellTokens(token: string, amount: Big): Promise<SellResult> {
    const poolInfo = await this.swap.findRaydiumPoolInfo(this.solMint, token);
    if (!poolInfo) {
      throw new BadRequestException(`Couldn't find pool info for token pair!`);
    }

    const tx = await this.swap.getSwapTransaction(
      token,
      amount.toNumber(),
      poolInfo,
      undefined,
      true,
      'out',
    );
    const result = await this.swap.sendVersionedTransaction(
      tx as VersionedTransaction,
    );

    return {
      transactionId: result,
    };
  }
}
