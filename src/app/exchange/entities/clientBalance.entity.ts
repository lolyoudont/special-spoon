import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { decimalConfig } from '../../../config';
import { ClientEntity } from './client.entity';
import { AssetEntity } from './asset.entity';
import Big from 'big.js';

@Entity('client_balances')
export class ClientBalanceEntity {
  @PrimaryColumn('uuid')
  client_id: string;

  @PrimaryColumn('uuid')
  asset_id: string;

  @Column('decimal', decimalConfig)
  balance_tokens: Big;

  // Relations

  @ManyToOne(() => ClientEntity, client => client.client_balances)
  @JoinColumn({ name: 'client_id', referencedColumnName: 'client_id' })
  client: ClientEntity;

  @ManyToOne(() => AssetEntity, asset => asset.client_balances)
  @JoinColumn({ name: 'asset_id', referencedColumnName: 'asset_id' })
  asset: AssetEntity;
}
