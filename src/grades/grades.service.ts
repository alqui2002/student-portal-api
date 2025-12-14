import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Commission } from '../commission/entities/commission.entity';
import { Grade } from './entities/grade.entity';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { AcademicHistory } from '../academic-history/entities/academic-history.entity';

@Injectable()
export class GradesService {
    constructor(
        @InjectRepository(Grade)
        private readonly gradeRepo: Repository<Grade>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Commission)
        private readonly commissionRepo: Repository<Commission>,

        @InjectRepository(AcademicHistory)
        private readonly historyRepo: Repository<AcademicHistory>,
    ) { }

    async createInitial(userId: string, commissionId: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const commission = await this.commissionRepo.findOne({ where: { id: commissionId } });

        if (!user || !commission) throw new NotFoundException('User or commission not found');

        const grade = new Grade();
        grade.user = user;
        grade.commission = commission;
        grade.status = 'in_progress';

        return this.gradeRepo.save(grade);
    }

    async findByUser(userId: string) {
        const grades = await this.gradeRepo.find({
            where: { user: { id: userId } },
            relations: ['commission'],
        });
        if (!grades.length) throw new NotFoundException('No grades found for this user');
        return grades;
    }

    async updateGrade(userId: string, commissionId: string, dto: UpdateGradeDto) {
        const grade = await this.gradeRepo.findOne({
            where: { user: { id: userId }, commission: { id: commissionId } },
            relations: ['user', 'commission'],
        });

        if (!grade) throw new NotFoundException('Grade record not found');

        Object.assign(grade, dto);

        if (grade.finalExam !== null && grade.finalExam !== undefined) {
            if (grade.finalExam >= 4) {
                grade.status = 'passed';
            } else {
                grade.status = 'failed';
            }

            await this.historyRepo.update(
                {
                    user: { id: userId },
                    commission: { id: commissionId },
                },
                {
                    status: grade.status,
                    finalNote: grade.finalExam?.toString() ?? null,
                },
            );
        }

        return this.gradeRepo.save(grade);
    }

    async findByUserAndCommission(userId: string, commissionId: string) {
        const grade = await this.gradeRepo.findOne({
            where: { user: { id: userId }, commission: { id: commissionId } },
            relations: ['commission'],
        });

        if (!grade)
            throw new NotFoundException('No grade record found for this user in the specified commission');

        return {
            commission: {
                id: grade.commission.id,
                professor: grade.commission.professorName,
                shift: grade.commission.shift,
                days: grade.commission.days,
            },
            firstExam: grade.firstExam,
            secondExam: grade.secondExam,
            finalExam: grade.finalExam,
            status: grade.status,
        };
    }

    async upsertGrade(
        userId: string,
        commissionId: string,
        dto: UpdateGradeDto,
      ) {
        const grade = await this.gradeRepo.findOne({
          where: {
            user: { id: userId },
            commission: { id: commissionId },
          },
        });
      
        if (grade) {
          Object.assign(grade, dto);
          return this.gradeRepo.save(grade);
        }
      
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const commission = await this.commissionRepo.findOne({
          where: { id: commissionId },
        });
      
        if (!user || !commission) {
          throw new NotFoundException('User or commission not found');
        }
      
        const newGrade = this.gradeRepo.create({
          user,
          commission,
          ...dto,
        });
      
        return this.gradeRepo.save(newGrade);
      }
      
}
