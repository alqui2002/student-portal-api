import { Controller, Post, Delete, Param, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
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
    @Req() req: any,
  ) {
    const token = req['rawToken'] || req.headers.authorization?.split(' ')[1];
    return this.enrollmentsService.enroll({ userId, courseId, commissionId }, token);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Delete(':courseId/commissions/:commissionId')
  withdraw(
    @Param('courseId') courseId: string,
    @Param('commissionId') commissionId: string,
    @Body('userId') userId: string,
    @Req() req: any,
  ) {
    const token = req['rawToken'] || req.headers.authorization?.split(' ')[1];
    return this.enrollmentsService.withdraw(userId, commissionId, token);
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
  async upsertFromCore(@Body() payload: any) {
    console.log(
      `📨 Enrollment core-event → ${JSON.stringify(payload)}`,
    );
  } 
}

