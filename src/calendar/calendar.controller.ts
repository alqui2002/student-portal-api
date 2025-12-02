import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { JwtDecodeGuard } from 'src/auth/jwt-decode.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) { }

  @Get()
  getAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.service.findAll(from, to, eventType);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(String(id));
  }

  @UseGuards(JwtDecodeGuard)
  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string) {
    return this.service.findByUser(String(userId));
  }

  @Post()
  create(@Body() body: CreateCalendarEventDto) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateCalendarEventDto>) {
    return this.service.update(String(id), body);
  }

  @Patch(':id')
  updateEventStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.service.updateStatus(id, body.status);
  }
}
