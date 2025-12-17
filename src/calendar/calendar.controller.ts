import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch, Req } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarSyncService } from './calendar-sync.service';

import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';
import { User } from 'src/auth/user.decorator';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly service: CalendarService,
    private readonly syncService: CalendarSyncService
  ) {}


  @Get('sync')
  @UseGuards(ExternalJwtAuthGuard)
  async syncFromAcademic(
    @User('sub') userUuid: string,
    @Req() req
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.service.syncFromAcademic(userUuid, token);
  }


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

  @UseGuards(ExternalJwtAuthGuard)
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
  @Post('sync')
  sync(@Req() req) {
    return this.syncService.syncUserCalendar(req.user.id);
  }


}
