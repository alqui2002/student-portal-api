// src/grades/grades.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  // 🟢 IMPORTAR DTO y Decoradores para Swagger/Tipado
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';
// 🟢 IMPORTAR DTO DE RESPUESTA
import { GetGradesResponseDto } from './dto/get-grades-response.dto';
import { ApiOkResponse } from '@nestjs/swagger'; // Asumo que usan Swagger
  
@Controller('grades')
@UseInterceptors(ClassSerializerInterceptor) // Para asegurar que los DTOs se serialicen
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
  // 🟢 Aplicar el DTO de respuesta para tipar la salida (importante para documentación/API)
  @ApiOkResponse({ type: GetGradesResponseDto }) 
  @Get('user/:userId/commission/:commissionId')
  getByUserAndCommission(
    @Param('userId') userId: string,
    @Param('commissionId') commissionId: string,
  ): Promise<GetGradesResponseDto> { // Tipamos la promesa
    return this.gradesService.findByUserAndCommission(
      userId,
      commissionId,
    );
  }
}