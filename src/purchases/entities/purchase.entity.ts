import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { IsOptional } from 'class-validator';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', nullable: true })
  purchase_id: number | null;


  @ManyToOne(() => User, (user) => user.purchases, { eager: true })
  user: User;

  @Column('jsonb')
  product: {
    name: string;
    description: string;
    productCode: string;
    subtotal: string;
    quantity: number;
  }[];

  @CreateDateColumn()
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: string;
}
