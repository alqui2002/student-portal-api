import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './entities/commission.entity';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(Commission)
    private commissionRepo: Repository<Commission>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) { }

  private getCommissionStatus(startDate: string, endDate: string): 'future' | 'in_progress' | 'past' {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) return 'future';
    if (today > end) return 'past';
    return 'in_progress';
  }

  async findByCourseWithStatus(courseId: string, status?: 'future' | 'in_progress' | 'past') {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const commissions = await this.commissionRepo.find({ where: { course: { id: courseId } } });

    const result = commissions.map((c) => ({
      ...c,
      status: this.getCommissionStatus(c.startDate, c.endDate),
    }));

    return status ? result.filter((c) => c.status === status) : result;
  }

  async findByCourse(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const commissions = await this.commissionRepo.find({ where: { course: { id: courseId } } });

    return commissions.map((c) => ({
      ...c,
      status: this.getCommissionStatus(c.startDate, c.endDate),
    }));
  }

  async create(courseId: string, dto: CreateCommissionDto) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const commission = this.commissionRepo.create({ ...dto, course });
    return this.commissionRepo.save(commission);
  }
  async upsertFromCore(dto: {
      uuid: string;
      courseId: string;
    
      days: string;
    
      startTime: string;
      endTime: string;
    
      shift: 'morning' | 'afternoon' | 'night';
      mode: 'virtual' | 'in person';
    
      classRoom: string;
      professorName: string;
    
      availableSpots: number;
      totalSpots: number;
    
      price: string;
    
      startDate: string;
      endDate: string;
    }) {
    
    // 1️⃣ validar materia
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });
  
    if (!course) {
      throw new NotFoundException(
        `Course ${dto.courseId} not found`,
      );
    }
  
    // 2️⃣ buscar comisión
    let commission = await this.commissionRepo.findOne({
      where: { id: dto.uuid },
      relations: ['course'],
    });
  
    // 3️⃣ crear si no existe
    if (!commission) {
      commission = this.commissionRepo.create({
        id: dto.uuid,
        course,
      });
    }
  
    // ✅ 4️⃣ ASIGNAR CAMPOS (ESTO FALTABA)
    commission.days = dto.days;
    commission.startTime = dto.startTime;
    commission.endTime = dto.endTime;
    commission.shift = dto.shift;
    commission.classRoom = dto.classRoom;
    commission.professorName = dto.professorName;
    commission.availableSpots = dto.availableSpots;
    commission.totalSpots = dto.totalSpots;
    commission.mode = dto.mode;
    commission.price = dto.price;
    commission.startDate = dto.startDate;
    commission.endDate = dto.endDate;
  
    await this.commissionRepo.save(commission);
  
    return {
      success: true,
      commissionId: commission.id,
      courseId: course.id,
    };
  }
  
}
