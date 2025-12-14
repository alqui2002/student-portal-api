import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController, CommissionSyncController } from './commission.controller';
import { CommissionService } from './commission.service';
import { Commission } from './entities/commission.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commission, Course])],
  controllers: [CommissionController, CommissionSyncController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
