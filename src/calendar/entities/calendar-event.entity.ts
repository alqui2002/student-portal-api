import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum EventType {
  Cafeteria = 'cafeteria',
  Exam = 'exam',
  Extracurricular = 'extracurricular',
  Evento = 'evento',
  Cancelled = 'cancelled',

}

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  startDateTime: Date;

  @Column({ type: 'timestamp' })
  endDateTime: Date;

  @Column({ nullable: true })
  eventType: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  sourceModule?: string; 

  @Column({ nullable: true })
  eventStatus?: string; 

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  user?: User;

  @Column({ type: 'date' })
  date: string;
}
