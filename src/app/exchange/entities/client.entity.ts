import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Big from 'big.js';
import { TransactionEntity } from './transaction.entity';
import { decimalConfig } from '../../../config';
import { ClientBalanceEntity } from './clientBalance.entity';

@Entity('clients')
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  client_id: string;

  @Column('text')
  name: string;

  @Column('decimal', decimalConfig)
  balance_sol: Big;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  last_updated: Date;

  // Relations

  @OneToMany(() => TransactionEntity, tx => tx.client)
  transactions: TransactionEntity[];

  @OneToMany(() => ClientBalanceEntity, balance => balance.client)
  client_balances: ClientBalanceEntity[];
}
