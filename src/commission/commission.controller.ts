import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

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

@Controller('commissions')
export class CommissionSyncController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('sync')
  @UseGuards(ExternalJwtAuthGuard)
  async syncCommissionsFromCore(@Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.commissionService.syncCommissionsFromCore(token);
  }
}
