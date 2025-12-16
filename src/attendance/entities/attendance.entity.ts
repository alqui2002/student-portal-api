import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Commission } from '../../commission/entities/commission.entity';

export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'A',
  HALF_DAY = 'M',
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.attendances, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Commission, (commission) => commission.attendances, {
    onDelete: 'CASCADE',
  })
  commission: Commission;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  present: AttendanceStatus;

  @CreateDateColumn()
  createdAt: Date;
}
