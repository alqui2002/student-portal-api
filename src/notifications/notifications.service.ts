import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Notification } from './entities/notifications.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CoreNotificationDto } from './dto/core-notification.dto';
import { NotiType } from './entities/notifications.entity';

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

// notifications.service.ts
async upsertFromCore(dto: CoreNotificationDto) {
  // 1️⃣ Idempotencia
  const exists = await this.notificationRepo.findOne({
    where: { id: dto.uuid },
  });

  if (exists) {
    return {
      success: true,
      notificationId: exists.id,
      skipped: true,
    };
  }

  // 2️⃣ Validar usuario
  const user = await this.userRepo.findOne({
    where: { id: dto.user_uuid },
  });

  if (!user) {
    throw new NotFoundException(
      `User ${dto.user_uuid} not found for notification`,
    );
  }

  // 3️⃣ Crear notificación
  const notification = this.notificationRepo.create({
    id: dto.uuid,
    user,
    title: dto.title,
    type: NotiType.Event,
    isRead: false,
    createdAt: dto.created_at
      ? new Date(dto.created_at)
      : new Date(),
  });
  

  await this.notificationRepo.save(notification);

  return {
    success: true,
    notificationId: notification.id,
  };
}

}
