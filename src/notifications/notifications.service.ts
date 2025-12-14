import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Notification } from './entities/notifications.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async getLatest(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async getUnread(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.notificationRepo.find({
      where: { user: { id: userId }, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateNotificationDto) {
    const { userId, title, message, type } = dto;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const notification: Partial<Notification> = {
      user,
      title,
      message,
      type,
      isRead: false, 
    };

    return this.notificationRepo.save(notification);
  }

  async update(id: string, body: { isRead?: boolean }) {
  const notification = await this.notificationRepo.findOne({ where: { id } });
  if (!notification) throw new NotFoundException('Notification not found');

  if (body.isRead !== undefined) {
    notification.isRead = body.isRead;
  }

  return this.notificationRepo.save(notification);
}
}
