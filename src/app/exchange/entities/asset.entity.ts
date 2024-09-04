import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TransactionEntity } from './transaction.entity';
import { decimalConfig } from '../../../config';
import { ClientBalanceEntity } from './clientBalance.entity';
import Big from 'big.js';

@Entity('assets')
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  asset_id: string;

  @Column('text', { unique: true })
  ticker: string;

  @Column('text', { unique: true })
  contract_address: string;

  @Column('decimal', decimalConfig)
  platform_balance: Big;

  // Relations

  @OneToMany(() => TransactionEntity, tx => tx.asset)
  transactions: TransactionEntity[];

  @OneToMany(() => ClientBalanceEntity, balance => balance.asset)
  client_balances: ClientBalanceEntity[];
}
