import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { User } from '../user/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Commission } from '../commission/entities/commission.entity';
import { AcademicHistory } from '../academic-history/entities/academic-history.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { validate as isUuid } from 'uuid';
import { GradesService } from '../grades/grades.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';


@Injectable()
export class EnrollmentsService {
  private readonly HUB_URL = process.env.HUB_URL || 'http://localhost:3001';
  private readonly logger = new Logger(EnrollmentsService.name)
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Commission)
    private commissionRepo: Repository<Commission>,
    @InjectRepository(AcademicHistory)
    private historyRepo: Repository<AcademicHistory>,
    private readonly gradesService: GradesService,
    private readonly httpService: HttpService,

  ) { }

  private async sendEnrollmentEventToHub(
    userId: string,
    courseId: string,
    commissionId: string,
    action: 'update' | 'delete' = 'update'
  ) {
    const payload = {
      userId,
      courseId,
      commissionId,
      date: new Date().toISOString(),
      action,
    };

    const endpoint = `${this.HUB_URL}/events/courses.commission.enrollment.updated`;

    try {
      await lastValueFrom(this.httpService.post(endpoint, payload));
      this.logger.log(`Evento enviado al Hub → ${endpoint}`);
    } catch (err) {
      this.logger.error(`Error enviando evento al Hub: ${err.message}`);
    }
  }

  private async sendEnrollmentToExternalAPI(
    userId: string,
    commissionId: string,
    token: string,
  ): Promise<string | null> {
    const endpoint = 'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/inscripciones';
    
    const payload = {
      uuid_curso: commissionId,
      user_uuid: userId,
      estado: 'CONFIRMADA',
      rol: 'ALUMNO',
    };

    if (!token) {
      this.logger.warn(`⚠️  No se puede enviar inscripción a API externa: token no proporcionado`);
      return null;
    }

    try {
      this.logger.log(`Enviando inscripción a API externa: ${JSON.stringify(payload)}`);
      
      const response = await lastValueFrom(
        this.httpService.post(endpoint, payload, {
          headers: {
            'authorization': `Bearer ${token}`,
            'content-type': 'application/json',
          },
        })
      );
      
      const coreUuid = response.data?.uuid || null;
      this.logger.log(`✅ Inscripción enviada exitosamente a API externa → ${endpoint}. Core UUID: ${coreUuid}`);
      return coreUuid;
    } catch (err: any) {
      const errorMessage = err.response?.data 
        ? JSON.stringify(err.response.data)
        : err.message;
      const statusCode = err.response?.status || 'N/A';
      
      this.logger.error(`❌ Error enviando inscripción a API externa (${statusCode}): ${errorMessage}`);
      this.logger.error(`Payload enviado: ${JSON.stringify(payload)}`);
      // No lanzamos el error para no interrumpir el flujo principal
      return null;
    }
  }

  private async deleteEnrollmentFromExternalAPI(
    coreUuid: string,
    token: string,
  ) {
    const endpoint = `https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/inscripciones/${coreUuid}`;

    if (!token) {
      this.logger.warn(`⚠️  No se puede eliminar inscripción de API externa: token no proporcionado`);
      return;
    }

    if (!coreUuid) {
      this.logger.warn(`⚠️  No se puede eliminar inscripción de API externa: coreUuid no encontrado`);
      return;
    }

    try {
      this.logger.log(`Eliminando inscripción de API externa: ${coreUuid}`);
      
      await lastValueFrom(
        this.httpService.delete(endpoint, {
          headers: {
            'authorization': `Bearer ${token}`,
          },
        })
      );
      
      this.logger.log(`✅ Inscripción eliminada exitosamente de API externa → ${endpoint}`);
    } catch (err: any) {
      const errorMessage = err.response?.data 
        ? JSON.stringify(err.response.data)
        : err.message;
      const statusCode = err.response?.status || 'N/A';
      
      this.logger.error(`❌ Error eliminando inscripción de API externa (${statusCode}): ${errorMessage}`);
      this.logger.error(`Core UUID: ${coreUuid}`);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  async enroll(dto: CreateEnrollmentDto, token?: string) {
    const { userId, courseId, commissionId } = dto;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    const commission = await this.commissionRepo.findOne({ where: { id: commissionId } });

    if (!user || !course || !commission) {
      throw new NotFoundException('Invalid enrollment data');
    }

    if (course.correlates && course.correlates.length > 0) {
      const histories = await this.historyRepo.find({
        where: {
          user: { id: userId },
          course: { id: In(course.correlates) },
        },
        relations: ['course'],
      });

      const approvedIds = histories
        .filter((h) => h.status === 'passed')
        .map((h) => h.course.id);

      const missing = course.correlates.filter((id) => !approvedIds.includes(id));

      if (missing.length > 0) {
        const missingCourses = await this.courseRepo.find({
          where: { id: In(missing) },
        });

        const missingNames = missingCourses.map((c) => c.name).join(', ');
        throw new ForbiddenException(
          `Cannot enroll in ${course.name}. Missing prerequisites: ${missingNames}`,
        );
      }
    }

    if (commission.availableSpots <= 0) {
      throw new BadRequestException('No available spots');
    }

    const existingEnrollment = await this.enrollmentRepo.findOne({
      where: { user: { id: userId }, commission: { id: commissionId } },
    });
    if (existingEnrollment) {
      throw new BadRequestException('User already enrolled in this commission');
    }

    const enrollment = this.enrollmentRepo.create({ user, course, commission });
    commission.availableSpots -= 1;
    await this.commissionRepo.save(commission);
    await this.enrollmentRepo.save(enrollment);

    const currentYear = new Date().getFullYear().toString();
    const currentSemester = new Date().getMonth() < 6 ? '1C' : '2C';

    const history = this.historyRepo.create({
      user,
      course,
      commission,
      semester: currentSemester,
      year: currentYear,
      status: 'in_progress',
      finalNote: null,
    });
    await this.historyRepo.save(history);
    await this.gradesService.createInitial(user.id, commission.id);

    // Enviar inscripción a API externa y guardar el coreUuid
    if (token) {
      const coreUuid = await this.sendEnrollmentToExternalAPI(userId, commissionId, token);
      if (coreUuid) {
        enrollment.coreUuid = coreUuid;
        await this.enrollmentRepo.save(enrollment);
      }
    }

    return {
      message: 'Enrollment successful and academic history record created',
      enrollment: {
        id: enrollment.id,
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
        },
        commission: {
          id: commission.id,
          days: commission.days,
          shift: commission.shift,
          professorName: commission.professorName,
        },
      },
      academicHistory: {
        semester: history.semester,
        year: history.year,
        finalNote: history.finalNote,
        status: history.status,
      },
    }

  }


  async withdraw(userId: string, commissionId: string, token?: string) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { user: { id: userId }, commission: { id: commissionId } },
      relations: ['commission', 'course'],
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    // Eliminar inscripción de API externa antes de borrarla localmente
    if (token && enrollment.coreUuid) {
      await this.deleteEnrollmentFromExternalAPI(enrollment.coreUuid, token);
    } else if (token && !enrollment.coreUuid) {
      this.logger.warn(`⚠️  No se puede eliminar inscripción de API externa: coreUuid no encontrado para enrollment ${enrollment.id}`);
    }

    enrollment.commission.availableSpots += 1;
    await this.commissionRepo.save(enrollment.commission);

    await this.historyRepo.delete({
      user: { id: userId },
      course: { id: enrollment.course.id },
      status: 'in_progress',
    });

    await this.enrollmentRepo.remove(enrollment);
    await this.sendEnrollmentEventToHub(userId, enrollment.course.id, commissionId, 'delete');
    return { message: 'Successfully withdrawn and academic history removed' };

  }

  async findByUser(userId: string) {
    if (!userId || !isUuid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const enrollments = await this.enrollmentRepo.find({
      where: { user: { id: userId } },
      relations: ['course', 'commission'],
    });

    if (!enrollments.length) {
      throw new NotFoundException('No enrollments found for this user');
    }

    const histories = await this.historyRepo.find({
      where: { user: { id: userId } },
      relations: ['course', 'commission'],
    });

    return enrollments.map((enr) => {
      const relatedHistory = histories.find(
        (h) => h.commission?.id === enr.commission?.id
      );

      return {
        enrollmentId: enr.id,
        course: enr.course
          ? {
            id: enr.course.id,
            name: enr.course.name,
            code: enr.course.code,
          }
          : { id: null, name: 'Sin curso asignado' },
        commission: enr.commission
          ? {
            id: enr.commission.id,
            professorName: enr.commission.professorName,
            shift: enr.commission.shift,
            days: enr.commission.days,
            startTime: enr.commission.startTime,
            endTime: enr.commission.endTime,
            classroom: enr.commission.classRoom,
          }
          : { id: null, professorName: 'Sin comisión asignada' },
        status: relatedHistory?.status || 'in_progress',
        finalNote: relatedHistory?.finalNote ?? null,
      };
    });
  }



  async findEnrollmentDetail(userId: string, commissionId: string) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { user: { id: userId }, commission: { id: commissionId } },
      relations: ['course', 'commission'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return {
      id: enrollment.id,
      course: enrollment.course
        ? { id: enrollment.course.id, name: enrollment.course.name }
        : null,
      commission: enrollment.commission
        ? {
          id: enrollment.commission.id,
          professorName: enrollment.commission.professorName,
          days: enrollment.commission.days,
          shift: enrollment.commission.shift,
          startTime: enrollment.commission.startTime,
          endTime: enrollment.commission.endTime,
          classroom: enrollment.commission.classRoom
        }
        : null,
    };
  }

  async upsertFromCore(dto: {
    uuid: string;
    userId: string;
    courseId: string;       // MATERIA (Course.id)
    commissionId: string;   // COMISION (Commission.id)
    role: string;
    status?: string;
  }) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);
  
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException(`Course ${dto.courseId} not found`);
  
    const commission = await this.commissionRepo.findOne({
      where: { id: dto.commissionId },
      relations: ['course'],
    });
    if (!commission) {
      throw new NotFoundException(`Commission ${dto.commissionId} not found`);
    }
  
    // opcional: asegurar consistencia (comisión pertenece a la materia)
    if (commission.course?.id && commission.course.id !== course.id) {
      throw new BadRequestException(
        `Commission ${commission.id} does not belong to course ${course.id}`,
      );
    }
  
    let enrollment = await this.enrollmentRepo.findOne({
      where: { id: dto.uuid },
      relations: ['user', 'course', 'commission'],
    });
  
    if (!enrollment) {
      enrollment = this.enrollmentRepo.create({
        id: dto.uuid,
        user,
        course,
        commission,
      });
    } else {
      enrollment.user = user;
      enrollment.course = course;
      enrollment.commission = commission;
    }
  
    await this.enrollmentRepo.save(enrollment);
  
    // DOCENTE => asignar profesor a ESA comisión
    if (dto.role === 'teacher') {
      await this.assignProfessorToCommission(user, commission);
    }
  
    return { success: true };
  }
  
  private async assignProfessorToCommission(user: User, commission: Commission) {
    const name =
      user.name && user.name.trim().length > 0
        ? user.name
        : 'Profesor asignado';
  
    commission.professorName = name;
  
    this.logger.log(
      `👨‍🏫 Asignando profesor "${name}" a comisión ${commission.id}`,
    );
  
    await this.commissionRepo.save(commission);
  }
  

}

