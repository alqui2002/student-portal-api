import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { GradesService } from './grades.service';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeFromCoreDto } from './dto/grade-from-core.dto';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.gradesService.findByUser(userId);
  }

  @Get('user/:userId/commission/:commissionId')
  findByUserAndCommission(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
  ) {
    return this.gradesService.findByUserAndCommission(userId, commissionId);
  }

  @Patch('user/:userId/commission/:commissionId')
  updateGrade(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.updateGrade(userId, commissionId, dto);
  }

  @Patch('user/:userId/commission/:commissionId')
  upsertGrade(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.upsertGrade(
      userId,
      commissionId,
      dto,
    );
  }



  
}
