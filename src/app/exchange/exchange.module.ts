import { Module } from '@nestjs/common';
import { ExchangeController } from './exchange.controller';
import { ExchangeService } from './exchange.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './entities/asset.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { DexModule } from '../dex/dex.module';

@Module({
  controllers: [ExchangeController],
  imports: [
    TypeOrmModule.forFeature([AssetEntity, TransactionEntity]),
    DexModule,
  ],
  providers: [ExchangeService],
})
export class ExchangeModule {}
