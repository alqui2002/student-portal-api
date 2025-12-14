import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';

@Controller('courses/:courseId/commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  findByCourse(@Param('courseId') courseId: string) {
    return this.commissionService.findByCourse(courseId);
  }

  @Post()
  create(@Param('courseId') courseId: string, @Body() dto: CreateCommissionDto) {
    return this.commissionService.create(courseId, dto);
  }

  @Get()
  findByCourseWithStatus(
    @Param('courseId') courseId: string,
    @Query('status') status?: 'future' | 'in_progress' | 'past'
  ) {
    return this.commissionService.findByCourseWithStatus(courseId, status);
  }

  @Post('core-event')
  upsertFromCore(@Body() dto: any) {
    return this.commissionService.upsertFromCore(dto);
  }


}
