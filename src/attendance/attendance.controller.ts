import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';
import { AttendanceFromCoreDto } from './entities/core-attendance.dto';

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

  @UseGuards(ExternalJwtAuthGuard)
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

  @Post('core-event')
  upsertFromCore(@Body() dto: AttendanceFromCoreDto) {
    return this.attendanceService.upsertFromCore(dto);
  }

}
