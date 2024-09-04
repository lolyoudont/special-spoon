import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { AssetEntity } from './asset.entity';
import { ClientEntity } from './client.entity';
import Big from 'big.js';
import { decimalConfig } from '../../../config';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export const transactionTypes = <const>['open_position', 'close_position'];
export type TransactionType = (typeof transactionTypes)[number];

export const positionTypes = <const>['long', 'short'];
export type PositionType = (typeof positionTypes)[number];

export const transactionStatuses = <const>['pending', 'successful', 'failed'];
export type TransactionStatus = (typeof transactionStatuses)[number];

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  transaction_id: string;

  @Column('uuid')
  @ApiProperty()
  client_id: string;

  @Column('uuid')
  @ApiProperty()
  asset_id: string;

  @Column('enum', {
    enum: transactionTypes,
  })
  @ApiProperty()
  transaction_type: TransactionType;

  @Column('enum', {
    enum: positionTypes,
  })
  @ApiProperty()
  position_type: PositionType;

  @Column('decimal', decimalConfig)
  @Transform(x => x.value.toFixed())
  @ApiProperty()
  amount_token: Big;

  @Column('decimal', decimalConfig)
  @Transform(x => x.value.toFixed())
  @ApiProperty()
  amount_sol: Big;

  @Column('enum', {
    enum: transactionStatuses,
  })
  @ApiProperty()
  status: TransactionStatus;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  @ApiProperty()
  date: Date;

  @Column('text', { nullable: true })
  @ApiProperty()
  dex_transaction_id: string | null;

  // Relations

  @ManyToOne(() => ClientEntity, client => client.transactions)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'client_id' })
  client: ClientEntity;

  @ManyToOne(() => AssetEntity, asset => asset.transactions)
  @JoinColumn({ name: 'asset_id', referencedColumnName: 'asset_id' })
  asset: AssetEntity;
}
