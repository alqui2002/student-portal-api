import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DinningService } from './dinning.service';
import { CreateDinningReservationDto } from './dto/create-dinning-reservation.dto';
import { UpdateDinningReservationDto } from './dto/update-dinning-reservation.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('dinning')
export class DinningController {
  constructor(private readonly dinningService: DinningService) {}

  @Get()
  findAll() {
    return this.dinningService.findAll();
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.dinningService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dinningService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDinningReservationDto) {
    return this.dinningService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDinningReservationDto) {
    return this.dinningService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dinningService.remove(id);
  }
}
