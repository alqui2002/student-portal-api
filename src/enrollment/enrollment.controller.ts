import { Controller, Post, Delete, Param, Body, Get, Query, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';
import { CoreEnrollmentDto } from './dto/core-enrollment.dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) { }

  @UseGuards(ExternalJwtAuthGuard)
  @Post(':courseId/commissions/:commissionId')
  enroll(
    @Param('courseId') courseId: string,
    @Param('commissionId') commissionId: string,
    @Body('userId') userId: string,
  ) {
    return this.enrollmentsService.enroll({ userId, courseId, commissionId });
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Delete(':courseId/commissions/:commissionId')
  withdraw(
    @Param('courseId') courseId: string,
    @Param('commissionId') commissionId: string,
    @Body('userId') userId: string,
  ) {
    return this.enrollmentsService.withdraw(userId, commissionId);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get()
  getUserEnrollments(@Query('userId') userId: string) {
    return this.enrollmentsService.findByUser(userId);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get(':commissionId')
  getEnrollmentDetail(
    @Param('commissionId') commissionId: string,
    @Query('userId') userId: string,
  ) {
    return this.enrollmentsService.findEnrollmentDetail(userId, commissionId);
  }
  @Post('core-event')
  upsertFromCore(@Body() dto: CoreEnrollmentDto) {
    return this.enrollmentsService.upsertFromCore(dto);
  }

  
}
