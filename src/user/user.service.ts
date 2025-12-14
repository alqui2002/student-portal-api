import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Career } from '../career/entities/career.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Career)
    private careersRepository: Repository<Career>,
  ) { }

  findAll() {
    return this.usersRepository.find();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { id: createUserDto.uuid },
    });
  
    if (existingUser) return existingUser;
  
    let career: Career | undefined = undefined;
  
    if (createUserDto.careerId) {
      const foundCareer = await this.careersRepository.findOne({
        where: { id: createUserDto.careerId },
      });
  
      if (!foundCareer)
        throw new NotFoundException(
          `Career with id ${createUserDto.careerId} not found`,
        );
      
      career = foundCareer;
    }
  
    const newUser = this.usersRepository.create({
      id: createUserDto.uuid,
      name: createUserDto.name,
      email: createUserDto.email,
      career: career, 
    });
  
    return this.usersRepository.save(newUser);
  }
  
  async findUserWithCourses(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      courses: user.enrollments.map((enr) => ({
        id: enr.course.id,
        code: enr.course.code,
        name: enr.course.name,
        description: enr.course.description,
      })),
    };
  }
  async upsertFromCore(dto: {
    uuid: string;
    name?: string;
    email?: string;
    careerId?: string | null;
  }) {
    let user = await this.usersRepository.findOne({
      where: { id: dto.uuid },
      relations: ['career'],
    });
  
    if (!user) {
      // CREATE
      user = this.usersRepository.create({
        id: dto.uuid,
        name: dto.name,
        email: dto.email,

      });
    } else {
      // UPDATE
      if (dto.name) user.name = dto.name;
      if (dto.email) user.email = dto.email;
    }
  
    // career opcional
    if (dto.careerId !== undefined) {
      if (dto.careerId === null) {
      } else {
        const career = await this.careersRepository.findOne({
          where: { id: dto.careerId },
        });
        if (career) user.career = career;
      }
    }
  
    return this.usersRepository.save(user);
  }
  
}
