import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(ExternalJwtAuthGuard)
  @Get()
  getNotifications(
    @Query('userId') userId: string,
    @Query('status') status?: string
  ) {
    if (status === 'unread') {
      return this.notificationsService.getUnread(userId);
    }
    return this.notificationsService.getLatest(userId);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @UseGuards(ExternalJwtAuthGuard)
   @Patch(':notificationId')
  update(
    @Param('notificationId') id: string,
    @Body() body: { isRead?: boolean },
  ) {
    return this.notificationsService.update(id, body);
  }
}
