import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
import { Commission } from '../../commission/entities/commission.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';
import { AcademicHistory } from '../../academic-history/entities/academic-history.entity';
import { Career } from '../../career/entities/career.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('uuid', { array: true, default: [] })
  correlates: string[];

  @OneToMany(() => Commission, (commission) => commission.course)
  commissions: Commission[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => AcademicHistory, (h) => h.course)
  academicHistory: AcademicHistory[];

  @ManyToMany(() => Career, (career) => career.courses)
  careers: Career[];

}
