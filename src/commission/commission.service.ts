import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './entities/commission.entity';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { Course } from '../courses/entities/course.entity';
import axios from 'axios';

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

  private mapShiftFromCore(turno: string): 'morning' | 'afternoon' | 'night' {
    const normalized = turno?.toUpperCase();
    if (normalized === 'MAÑANA' || normalized === 'MANANA') return 'morning';
    if (normalized === 'TARDE') return 'afternoon';
    if (normalized === 'NOCHE') return 'night';
    return 'afternoon'; // default
  }

  private mapModeFromCore(modalidad: string): 'virtual' | 'in person' {
    const normalized = modalidad?.toUpperCase();
    if (normalized === 'VIRTUAL') return 'virtual';
    if (normalized === 'PRESENCIAL') return 'in person';
    if (normalized === 'HÍBRIDA' || normalized === 'HIBRIDA') return 'in person';
    return 'in person'; // default
  }

  async syncCommissionsFromCore(token: string) {
    try {
      // 1) Llamo al CORE
      const response = await axios.get(
        'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/cursos',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const commissions = response.data?.data ?? [];

      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      for (const c of commissions) {
        // Validar que existe el course (uuid_materia)
        const course = await this.courseRepo.findOne({
          where: { id: c.uuid_materia }
        });

        if (!course) {
          skipped++;
          continue; // Skip si no existe el course
        }

        const exists = await this.commissionRepo.findOne({
          where: { id: c.uuid },
          relations: ['course']
        });

        // Mapear campos del API de core a la entidad Commission
        const shift = this.mapShiftFromCore(c.turno);
        const mode = this.mapModeFromCore(c.modalidad);
        
        // Calcular availableSpots: si existe, mantener el actual, sino usar totalSpots
        const totalSpots = c.cantidad_max || 0;
        const availableSpots = exists 
          ? exists.availableSpots 
          : totalSpots;

        // Formatear fechas
        const startDate = c.desde ? new Date(c.desde).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const endDate = c.hasta ? new Date(c.hasta).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Construir classRoom con sede y aula
        const classRoom = c.sede && c.aula 
          ? `${c.sede} - ${c.aula}` 
          : c.aula || c.sede || 'Sin aula asignada';

        if (!exists) {
          // Crear nueva comisión
          const newCommission = this.commissionRepo.create({
            id: c.uuid,
            course,
            days: c.dia || 'LUNES',
            startTime: '08:00', // Default, no viene en el API
            endTime: '12:00', // Default, no viene en el API
            shift,
            classRoom,
            professorName: 'Sin profesor asignado', // No viene en el API de core
            availableSpots,
            totalSpots,
            mode,
            price: '0.00', // Default, no viene en el API
            startDate,
            endDate,
          });

          await this.commissionRepo.save(newCommission);
          inserted++;
        } else {
          // Actualizar comisión existente (solo si está activa)
          if (c.estado === 'activo') {
            exists.days = c.dia || exists.days;
            exists.shift = shift;
            exists.classRoom = classRoom;
            exists.totalSpots = totalSpots;
            exists.mode = mode;
            exists.startDate = startDate;
            exists.endDate = endDate;
            // No actualizamos availableSpots para no perder las inscripciones existentes
            // Solo actualizamos si el totalSpots cambió y es mayor
            if (totalSpots > exists.totalSpots) {
              exists.availableSpots = exists.availableSpots + (totalSpots - exists.totalSpots);
            }

            await this.commissionRepo.save(exists);
            updated++;
          }
        }
      }

      return {
        success: true,
        totalReceived: commissions.length,
        inserted,
        updated,
        skipped,
      };

    } catch (err) {
      console.error(err);
      throw new Error('Error al sincronizar comisiones del CORE');
    }
  }
  
}
