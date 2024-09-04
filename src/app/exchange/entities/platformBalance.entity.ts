import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Big from 'big.js';
import { decimalConfig } from '../../../config';

@Entity('platform_balance')
export class PlatformBalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  balance_id: string;

  @Column('decimal', decimalConfig)
  balance_sol: Big;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  last_updated: Date;
}
