import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DinningService } from './dinning.service';
import { CreateDinningReservationDto } from './dto/create-dinning-reservation.dto';
import { UpdateDinningReservationDto } from './dto/update-dinning-reservation.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('dinning')
export class DinningController {
  constructor(private readonly dinningService: DinningService) {}

  @Get()
  @UseGuards(ExternalJwtAuthGuard)
  findAll() {
    return this.dinningService.findAll();
  }

  @Get('user/:userId')
  @UseGuards(ExternalJwtAuthGuard)
  findByUser(@Param('userId') userId: string) {
    return this.dinningService.findByUser(userId);
  }

  @Get(':id')
  @UseGuards(ExternalJwtAuthGuard)
  findOne(@Param('id') reservationId: number) {
    return this.dinningService.findOne(reservationId);
  }

  @Post()
  create(@Body() dto: CreateDinningReservationDto) {
    return this.dinningService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') reservationId: number, @Body() dto: UpdateDinningReservationDto) {
    return this.dinningService.update(reservationId, dto);
  }

  @Delete(':id')
  remove(@Param('id') reservationId: number) {
    return this.dinningService.remove(reservationId);
  }
}
