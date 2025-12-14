// grades.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // 🔹 UI / HUB / EVENTOS → UPSERT
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

  // 🔹 Lectura
  @UseGuards(ExternalJwtAuthGuard)
  @Get('user/:userId/commission/:commissionId')
  getByUserAndCommission(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
  ) {
    return this.gradesService.findByUserAndCommission(
      userId,
      commissionId,
    );
  }
}
