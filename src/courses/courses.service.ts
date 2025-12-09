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

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

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
}
