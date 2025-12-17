import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';
import { GetGradesResponseDto } from './dto/get-grades-response.dto';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('grades')
@UseInterceptors(ClassSerializerInterceptor)
export class GradesController {
  constructor(private readonly gradesService: GradesService) { }

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

  @UseGuards(ExternalJwtAuthGuard)
  @ApiOkResponse({ type: GetGradesResponseDto })
  @Get('user/:userId/commission/:commissionId')
  getByUserAndCommission(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
  ): Promise<GetGradesResponseDto> {
    return this.gradesService.findByUserAndCommission(
      userId,
      commissionId,
    );
  }
}