// notifications/dto/core-notification.dto.ts
import { IsString, IsUUID, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { NotiType } from '../entities/notifications.entity';

export class CoreNotificationDto {
  @IsUUID()
  uuid: string;

  @IsUUID()
  user_uuid: string;

  @IsString()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotiType)
  type: NotiType;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  created_at?: string;
  @IsOptional()
  metadata?: Record<string, any>;
}
