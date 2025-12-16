import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn('uuid')
  uuid: string;

  @Column({ type: 'uuid', nullable: true })
  from_wallet_uuid?: string;

  @Column({ type: 'uuid', nullable: true })
  to_wallet_uuid?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ length: 10, nullable: true })
  currency?: string;

  @Column({ length: 20, nullable: true })
  type?: string;

  @Column({ length: 20, nullable: true })
  status?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'timestamp', nullable: true })
  processed_at?: Date;

  @Column({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;
}

