import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicHistory } from './entities/academic-history.entity';

@Injectable()
export class AcademicHistoryService {
  constructor(
    @InjectRepository(AcademicHistory)
    private historyRepo: Repository<AcademicHistory>,
  ) {}

  async getUserHistory(userId: string) {
    const histories = await this.historyRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'course', 'commission'],
      order: { year: 'ASC' },
    });

    if (!histories.length) {
      throw new NotFoundException('No academic history found for this user');
    }

    return histories.map((h) => ({
      id: h.id,
      course: h.course
        ? { id: h.course.id, name: h.course.name }
        : { id: null, name: 'Course not found' },
      commission: h.commission
        ? {
            id: h.commission.id,
            professorName: h.commission.professorName,
            shift: h.commission.shift,
          }
        : { id: null, professorName: 'Commission not found' },
      semester: h.semester,
      year: h.year,
      status: h.status,
      finalNote: h.finalNote,
    }));
  }

  async updateGrade(
    userId: string,
    courseId: string,
    data: { finalNote: string; status: 'passed' | 'failed' },
  ) {
    const record = await this.historyRepo.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });

    if (!record) throw new NotFoundException('Enrollment not found in history');

    record.finalNote = data.finalNote;
    record.status = data.status;
    return this.historyRepo.save(record);
  }
}