import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@UseGuards(ExternalJwtAuthGuard)
@Controller('commissions/:commissionId/attendances')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post(':userId')
  markAttendance(
    @Param('commissionId') commissionId: string,
    @Param('userId') userId: string,
    @Body() body: { present: boolean; date?: string },
  ) {
    return this.attendanceService.markAttendance(
      userId,           
      commissionId,
      body.present,
      body.date,
    );
  }

  @Get(':userId')
  getUserAttendance(
    @Param('commissionId') commissionId: string,
    @Param('userId') userId: string,
  ) {
    return this.attendanceService.getUserAttendance(
      userId,           
      commissionId,
    );
  }

  @Get()
  getCommissionAttendance(@Param('commissionId') commissionId: string) {
    return this.attendanceService.getCommissionAttendance(commissionId);
  }
}
