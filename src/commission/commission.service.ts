import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './entities/commission.entity';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { Course } from '../courses/entities/course.entity';
import axios from 'axios';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

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

  async remove(commissionId: string) {
    const commission = await this.commissionRepo.findOne({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    await this.commissionRepo.remove(commission);
    return { success: true };
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

    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course ${dto.courseId} not found`,
      );
    }

    let commission = await this.commissionRepo.findOne({
      where: { id: dto.uuid },
      relations: ['course'],
    });

    if (!commission) {
      commission = this.commissionRepo.create({
        id: dto.uuid,
        course,
      });
    }

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

  private mapShiftFromCore(turno: string): 'morning' | 'afternoon' | 'night' {
    const normalized = turno?.toUpperCase();
    if (normalized === 'MAÑANA' || normalized === 'MANANA') return 'morning';
    if (normalized === 'TARDE') return 'afternoon';
    if (normalized === 'NOCHE') return 'night';
    return 'afternoon';
  }

  private mapModeFromCore(modalidad: string): 'virtual' | 'in person' {
    const normalized = modalidad?.toUpperCase();
    if (normalized === 'VIRTUAL') return 'virtual';
    if (normalized === 'PRESENCIAL') return 'in person';
    if (normalized === 'HÍBRIDA' || normalized === 'HIBRIDA') return 'in person';
    return 'in person';
  }

  private getTimesByShift(shift: 'morning' | 'afternoon' | 'night'): { startTime: string; endTime: string } {
    switch (shift) {
      case 'morning':
        return { startTime: '08:00', endTime: '12:00' };
      case 'afternoon':
        return { startTime: '14:00', endTime: '18:00' };
      case 'night':
        return { startTime: '18:30', endTime: '22:00' };
      default:
        return { startTime: '14:00', endTime: '18:00' };
    }
  }

  async syncCommissionsFromCore(token: string) {
    try {
      this.logger.log('Iniciando sincronización de comisiones desde CORE...');

      const response = await axios.get(
        'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/cursos',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const commissions = response.data?.data ?? [];
      this.logger.log(`Comisiones recibidas del CORE: ${commissions.length}`);

      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      for (const c of commissions) {
        const course = await this.courseRepo.findOne({
          where: { id: c.uuid_materia }
        });

        if (!course) {
          skipped++;
          this.logger.warn(`⏭️  Comisión ${c.uuid} (${c.comision}) SKIP - Course ${c.uuid_materia} no encontrado`);
          continue;
        }

        const exists = await this.commissionRepo.findOne({
          where: { id: c.uuid },
          relations: ['course']
        });

        const shift = this.mapShiftFromCore(c.turno);
        const mode = this.mapModeFromCore(c.modalidad);
        const { startTime, endTime } = this.getTimesByShift(shift);

        const totalSpots = c.cantidad_max || 0;
        const availableSpots = exists
          ? exists.availableSpots
          : totalSpots;

        const startDate = c.desde ? new Date(c.desde).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = c.hasta ? new Date(c.hasta).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        const classRoom = c.sede && c.aula
          ? `${c.sede} - ${c.aula}`
          : c.aula || c.sede || 'Sin aula asignada';

        if (!exists) {
          const newCommission = this.commissionRepo.create({
            id: c.uuid,
            course,
            days: c.dia || 'LUNES',
            startTime,
            endTime,
            shift,
            classRoom,
            professorName: 'Sin profesor asignado',
            availableSpots,
            totalSpots,
            mode,
            price: '0.00',
            startDate,
            endDate,
          });

          await this.commissionRepo.save(newCommission);
          inserted++;
          this.logger.log(`✅ INSERTADA - Comisión ${c.uuid} (${c.comision}) - Course: ${course.name} - Turno: ${c.turno} - Modalidad: ${c.modalidad}`);
        } else {
          if (c.estado === 'activo') {
            exists.days = c.dia || exists.days;
            exists.shift = shift;
            exists.startTime = startTime;
            exists.endTime = endTime;
            exists.classRoom = classRoom;
            exists.totalSpots = totalSpots;
            exists.mode = mode;
            exists.startDate = startDate;
            exists.endDate = endDate;
            if (totalSpots > exists.totalSpots) {
              exists.availableSpots = exists.availableSpots + (totalSpots - exists.totalSpots);
            }

            await this.commissionRepo.save(exists);
            updated++;
            this.logger.log(`🔄 ACTUALIZADA - Comisión ${c.uuid} (${c.comision}) - Course: ${course.name} - Estado: ${c.estado}`);
          } else {
            this.logger.log(`⏸️  Comisión ${c.uuid} (${c.comision}) OMITIDA - Estado: ${c.estado} (solo se actualizan las activas)`);
          }
        }
      }

      this.logger.log(`📊 Resumen de sincronización: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas de ${commissions.length} totales`);

      return {
        success: true,
        totalReceived: commissions.length,
        inserted,
        updated,
        skipped,
      };

    } catch (err) {
      this.logger.error(`❌ Error al sincronizar comisiones del CORE: ${err.message}`);
      console.error(err);
      throw new Error('Error al sincronizar comisiones del CORE');
    }
  }

}
