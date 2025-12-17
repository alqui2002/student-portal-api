import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { User } from '../user/entities/user.entity';
import { Commission } from '../commission/entities/commission.entity';
import { AttendanceFromCoreDto } from './entities/core-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
  ) { }

  async markAttendance(userId: string, commissionId: string, present: AttendanceStatus, date?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const commission = await this.commissionRepo.findOne({ where: { id: commissionId } });

    if (!user || !commission) {
      throw new NotFoundException('User or commission not found');
    }
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    let attendance = await this.attendanceRepo.findOne({
      where: { user: { id: userId }, commission: { id: commissionId }, date: attendanceDate },
    });

    if (attendance) {
      attendance.present = present;
    } else {
      attendance = this.attendanceRepo.create({
        user,
        commission,
        date: attendanceDate,
        present,
      });
    }

    return this.attendanceRepo.save(attendance);
  }

  async getUserAttendance(userId: string, commissionId: string) {
    return this.attendanceRepo.find({
      where: { user: { id: userId }, commission: { id: commissionId } },
      order: { date: 'ASC' },
    });
  }

  async getCommissionAttendance(commissionId: string) {
    return this.attendanceRepo.find({
      where: { commission: { id: commissionId } },
      relations: ['user'],
      order: { date: 'ASC' },
    });
  }
  async upsertFromCore(dto: AttendanceFromCoreDto) {
    const { studentId, courseId, date, status } = dto;

    const user = await this.userRepo.findOne({
      where: { id: studentId },
    });
    if (!user) {
      throw new NotFoundException(`User ${studentId} not found`);
    }

    const commission = await this.commissionRepo.findOne({
      where: { id: courseId },
    });
    if (!commission) {
      throw new NotFoundException(`Commission ${courseId} not found`);
    }

    let attendance = await this.attendanceRepo.findOne({
      where: {
        user: { id: user.id },
        commission: { id: commission.id },
        date,
      },
    });

    if (attendance) {
      attendance.present = status as AttendanceStatus;
      return this.attendanceRepo.save(attendance);
    }
    attendance = this.attendanceRepo.create({
      user,
      commission,
      date,
      present: status as AttendanceStatus,
    });

    return this.attendanceRepo.save(attendance);
  }
}
