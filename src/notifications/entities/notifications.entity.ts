import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotiType {
  Sanction = 'sanction',
  Exam = 'exam',
  Event = 'event',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ type: 'enum', enum: NotiType })
  type: NotiType;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}
