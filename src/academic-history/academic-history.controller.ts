import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { AcademicHistoryService } from './academic-history.service';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('academic-history')
export class AcademicHistoryController {
  constructor(private readonly academicHistoryService: AcademicHistoryService) {}

  @UseGuards(ExternalJwtAuthGuard)
  @Get(':userId')
  getUserHistory(@Param('userId') userId: string) {
    return this.academicHistoryService.getUserHistory(userId);
  }

  @Patch(':userId/courses/:courseId')
  updateGrade(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
    @Body() body: { finalNote: string; status: 'passed' | 'failed' },
  ) {
    return this.academicHistoryService.updateGrade(userId, commissionId, body);
  }
}
