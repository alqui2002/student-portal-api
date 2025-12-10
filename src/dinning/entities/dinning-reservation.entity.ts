import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface SlotTime {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

@Entity('dinning_reservations')
export class DinningReservation {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 100 })
  locationId: string;

  @Column({ type: 'varchar', length: 50 })
  mealTime: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reservationTimeSlot?: string | null;

  @Column({ type: 'timestamp with time zone' })
  reservationDate: Date;

  @Column({ type: 'varchar', length: 30 })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'jsonb' })
  slotStartTime: SlotTime;

  @Column({ type: 'jsonb' })
  slotEndTime: SlotTime;
}
