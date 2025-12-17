import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Course } from './entities/course.entity';
import { User } from '../user/entities/user.entity';
import { Career } from 'src/career/entities/career.entity';
import axios from 'axios';

const CORE_API_BASE_URL =
  'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,

    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async findAll() {
    const courses = await this.courseRepo.find({
      relations: ['commissions', 'careers'],
    });

    if (!courses.length) throw new NotFoundException('No courses found');

    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      careers: c.careers?.map((career) => career.name) || [],
      totalCommissions: c.commissions?.length || 0,
    }));
  }

  async findOne(id: string) {
    if (!id || !isUuid(id)) {
      console.warn('⚠️ findOne() recibió un ID inválido:', id);
      throw new BadRequestException('Invalid course ID');
    }

    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['commissions', 'careers'],
    });

    if (!course) throw new NotFoundException(`Course with ID ${id} not found`);

    const validCorrelates = (course.correlates || []).filter(
      (id) => typeof id === 'string' && isUuid(id),
    );

    const correlatives =
      validCorrelates.length > 0
        ? await this.courseRepo.find({ where: { id: In(validCorrelates) } })
        : [];

    return {
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      careers: course.careers?.map((career) => ({
        id: career.id,
        name: career.name,
      })),
      correlatives: correlatives.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
      })),
      commissions: course.commissions || [],
    };
  }

  async findCoursesForUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['career'],
    });

    if (!user || !user.career)
      throw new NotFoundException('User or career not found');

    const courses = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.careers', 'career')
      .where('career.id = :careerId', { careerId: user.career.id })
      .leftJoinAndSelect('course.commissions', 'commission')
      .getMany();

    if (!courses.length)
      throw new NotFoundException('No courses found for this career');

    return Promise.all(
      courses.map(async (c) => {
        const validCorrelates = (c.correlates || []).filter(
          (id) => typeof id === 'string' && isUuid(id),
        );

        const correlatives =
          validCorrelates.length > 0
            ? await this.courseRepo.find({ where: { id: In(validCorrelates) } })
            : [];

        return {
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description,
          careers: c.careers?.map((car) => car.name) || [],
          correlatives: correlatives.map((corr) => ({
            id: corr.id,
            name: corr.name,
          })),
        };
      }),
    );
  }

  async create(courseData: Partial<Course>) {
    if (!courseData.name || !courseData.code)
      throw new BadRequestException('Missing course name or code');

    const course = this.courseRepo.create(courseData);
    return this.courseRepo.save(course);
  }

  async findAvailableCoursesForUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['career'],
    });

    if (!user || !user.career)
      throw new NotFoundException('User or career not found');

    const allCourses = await this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.careers', 'career')
      .leftJoinAndSelect('course.commissions', 'commission')
      .where('career.id = :careerId', { careerId: user.career.id })
      .getMany();

    const history = await this.courseRepo.manager
      .getRepository('academic_history')
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.course', 'course')
      .where('h.userId = :userId', { userId })
      .getMany();

    const approvedIds = history
      .filter((h) => h.status === 'passed')
      .map((h) => h.course.id);

    const inProgressIds = history
      .filter((h) => h.status === 'in_progress')
      .map((h) => h.course.id);

    const availableCourses = allCourses.filter((course) => {
      const alreadyApproved = approvedIds.includes(course.id);
      const validCorrelates = (course.correlates || []).filter(
        (id) => typeof id === 'string' && isUuid(id),
      );

      const pendingCorrelatives = validCorrelates.some(
        (corrId) => !approvedIds.includes(corrId),
      );

      if (inProgressIds.includes(course.id)) return true;
      return !alreadyApproved && !pendingCorrelatives;
    });

    const today = new Date();

    return Promise.all(
      availableCourses.map(async (c) => {
        const validCorrelates = (c.correlates || []).filter(
          (id) => typeof id === 'string' && isUuid(id),
        );

        const correlatives =
          validCorrelates.length > 0
            ? await this.courseRepo.find({ where: { id: In(validCorrelates) } })
            : [];

        let status = 'available';
        if (approvedIds.includes(c.id)) status = 'passed';
        else if (inProgressIds.includes(c.id)) status = 'in_progress';

        const futureCommissions =
          (c.commissions || []).filter((comm) => {
            const start = new Date(comm.startDate);
            return start > today;
          }) || [];

        return {
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description,
          correlatives: correlatives.map((corr) => ({
            id: corr.id,
            name: corr.name,
          })),
          status,
          commissions:
            status === 'available'
              ? futureCommissions.map((comm) => ({
                id: comm.id,
                days: comm.days,
                shift: comm.shift,
                mode: comm.mode,
                startTime: comm.startTime,
                endTime: comm.endTime,
                classRoom: comm.classRoom,
                professorName: comm.professorName,
                availableSpots: comm.availableSpots,
                totalSpots: comm.totalSpots,
                startDate: comm.startDate,
                endDate: comm.endDate,
              }))
              : [],
        };
      }),
    );
  }
  private async linkCourseToCareer(careerId: string, courseId: string) {
    const career = await this.careerRepo.findOne({
      where: { id: careerId },
      relations: ['courses'],
    });

    if (!career) {
      throw new NotFoundException(`Career ${careerId} not found`);
    }

    const alreadyLinked = career.courses.some(
      (c) => c.id === courseId,
    );

    if (alreadyLinked) return;

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    career.courses.push(course);
    await this.careerRepo.save(career);
  }


  async upsertFromCore(dto: {
    uuid: string;
    name: string;
    description?: string;
    careerId: string;
    code: string;
  }) {
    if (!dto.uuid || !dto.name || !dto.code || !dto.careerId) {
      throw new BadRequestException('Invalid course payload from CORE');
    }

    let course = await this.courseRepo.findOne({
      where: { id: dto.uuid },
    });

    if (!course) {
      course = this.courseRepo.create({
        id: dto.uuid,
        name: dto.name,
        description: dto.description,
        code: dto.code,
      });

      await this.courseRepo.save(course);
    } else {
      course.name = dto.name;
      course.description = dto.description ?? course.description;
      course.code = dto.code;
      await this.courseRepo.save(course);
    }

    await this.linkCourseToCareer(dto.careerId, course.id);

    return {
      success: true,
      courseId: course.id,
      careerId: dto.careerId,
    };
  }
  async syncCousesFromCore(token: string) {
    try {
      const materias = await this.fetchMateriasFromCore(token);
      let inserted = 0;
      let updated = 0;

      for (const materia of materias) {
        const correlatives = await this.fetchCorrelativesFromCore(
          token,
          materia.uuid,
        );

        const payload = this.mapCoreMateriaToCourse(materia, correlatives);

        const existing = await this.courseRepo.findOne({
          where: { id: payload.id },
        });

        if (!existing) {
          const course = this.courseRepo.create(payload);
          await this.courseRepo.save(course);
          inserted++;
        } else {
          existing.name = payload.name;
          existing.description = payload.description;
          existing.code = payload.code;
          existing.correlates = payload.correlates;
          await this.courseRepo.save(existing);
          updated++;
        }

        const careerId =
          materia.uuid_carrera ||
          materia.careerId ||
          materia.carrera?.uuid ||
          null;

        if (careerId) {
          try {
            await this.linkCourseToCareer(careerId, payload.id);
          } catch (linkError) {
            console.error(
              `No se pudo vincular la carrera ${careerId} con la materia ${payload.id}`,
              linkError instanceof Error ? linkError.message : linkError,
            );
          }
        }
      }

      return {
        success: true,
        totalReceived: materias.length,
        inserted,
        updated,
      };
    } catch (err) {
      console.error('Error sincronizando materias desde el CORE', err);
      throw new Error('Error al sincronizar carreras del CORE');
    }
  }

  private async fetchMateriasFromCore(token: string): Promise<any[]> {
    const response = await axios.get(`${CORE_API_BASE_URL}/materias`, {
      headers: this.buildCoreHeaders(token),
    });

    const materias = response.data?.data;
    return Array.isArray(materias) ? materias : [];
  }

  private async fetchCorrelativesFromCore(
    token: string,
    materiaId: string,
  ): Promise<string[]> {
    if (!materiaId) return [];

    try {
      const response = await axios.get(
        `${CORE_API_BASE_URL}/materias/${materiaId}/correlativas`,
        {
          headers: this.buildCoreHeaders(token),
        },
      );

      const correlatives = response.data?.data ?? [];
      return correlatives
        .map((corr) => corr?.uuid_materia_correlativa)
        .filter((id): id is string => typeof id === 'string');
    } catch (error) {
      console.error(
        `No se pudieron obtener correlativas para la materia ${materiaId}`,
        error instanceof Error ? error.message : error,
      );
      return [];
    }
  }

  private mapCoreMateriaToCourse(
    materia: any,
    correlatives: string[],
  ): {
    id: string;
    name: string;
    description?: string;
    code: string;
    correlates: string[];
  } {
    const code = materia?.code || materia?.codigo || materia?.uuid;

    return {
      id: materia.uuid,
      name: materia.nombre || materia.name || materia.uuid,
      description:
        materia.description === null || materia.description === undefined
          ? undefined
          : materia.description,
      code,
      correlates: Array.isArray(correlatives) ? correlatives : [],
    };
  }

  private buildCoreHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async addCorrelative(courseId: string, correlativeId: string) {
    if (!isUuid(courseId)) {
      throw new BadRequestException('Invalid courseId');
    }

    if (!isUuid(correlativeId)) {
      throw new BadRequestException('Invalid correlativeId');
    }

    if (courseId === correlativeId) {
      throw new BadRequestException('A course cannot be correlative of itself');
    }

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    const correlative = await this.courseRepo.findOne({
      where: { id: correlativeId },
    });

    if (!correlative) {
      throw new NotFoundException(
        `Correlative course ${correlativeId} not found`,
      );
    }

    const correlates = Array.isArray(course.correlates)
      ? course.correlates
      : [];

    if (correlates.includes(correlativeId)) {
      return {
        success: true,
        message: 'Correlative already exists',
        correlates,
      };
    }

    course.correlates = [...correlates, correlativeId];
    await this.courseRepo.save(course);

    return {
      success: true,
      courseId,
      correlates: course.correlates,
    };
  }
  async removeCorrelative(courseId: string, correlativeId: string) {
    if (!isUuid(courseId)) {
      throw new BadRequestException('Invalid courseId');
    }

    if (!isUuid(correlativeId)) {
      throw new BadRequestException('Invalid correlativeId');
    }

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    const correlates = Array.isArray(course.correlates)
      ? course.correlates
      : [];

    if (!correlates.includes(correlativeId)) {
      return {
        success: true,
        message: 'Correlative not found on course',
        correlates,
      };
    }

    course.correlates = correlates.filter(id => id !== correlativeId);
    await this.courseRepo.save(course);

    return {
      success: true,
      courseId,
      correlates: course.correlates,
    };
  }


}
