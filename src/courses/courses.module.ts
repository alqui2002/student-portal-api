import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { User } from '../user/entities/user.entity';
import { Career } from '../career/entities/career.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, User,  Career,])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
