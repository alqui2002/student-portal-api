import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Commission } from '../../commission/entities/commission.entity';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Commission, (commission) => commission.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commissionId' })
  commission: Commission;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  firstExam: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  secondExam: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  finalExam: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  recuExam: number;

  @Column({ type: 'varchar', length: 20, default: 'in_progress' })
  status: 'in_progress' | 'passed' | 'failed';
}
