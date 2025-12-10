import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from './entities/career.entity';
import { Course } from '../courses/entities/course.entity';
import axios from 'axios';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) { }

  async findAll() {
    return this.careerRepo.find({ relations: ['courses'] });
  }

  async findOne(id: string) {
    const career = await this.careerRepo.findOne({ where: { id }, relations: ['courses'] });
    if (!career) throw new NotFoundException(`Career with ID ${id} not found`);
    return career;
  }

  async create(data: Partial<Career>) {
    const career = this.careerRepo.create(data);
    return this.careerRepo.save(career);
  }

  async addCourse(careerId: string, courseId: string) {
    const career = await this.careerRepo.findOne({ where: { id: careerId }, relations: ['courses'] });
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!career || !course) throw new NotFoundException('Career or Course not found');

    const alreadyExists = career.courses.some((c) => c.id === course.id);
    if (alreadyExists) {
      throw new BadRequestException('Course already assigned to this career');
    }

    career.courses.push(course);
    await this.careerRepo.save(career);

    return { message: `Course ${course.name} added to ${career.name}` };
  }

  async syncCareersFromCore(token: string) {
    try {
      // 1) Llamo al CORE
      const response = await axios.get(
        "https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/careers",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      const careers = response.data?.data ?? [];
  
      let inserted = 0;
  
      for (const c of careers) {
        const exists = await this.careerRepo.findOne({
          where: { id: c.uuid }
        });
  
        if (!exists) {
          // 2) Mapear SOLO lo que tu entity acepta
          const newCareer = this.careerRepo.create({
            id: c.uuid,
            name: c.name,
            description: c.description ?? null,
          });
  
          await this.careerRepo.save(newCareer);
          inserted++;
        }
      }
  
      return {
        success: true,
        totalReceived: careers.length,
        inserted,
      };
  
    } catch (err) {
      console.error(err);
      throw new Error("Error al sincronizar carreras del CORE");
    }
  }
  
}  