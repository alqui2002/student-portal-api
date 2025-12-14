// notifications/dto/core-notification.dto.ts
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CoreNotificationDto {
  @IsUUID()
  uuid: string;

  @IsUUID()
  user_uuid: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  created_at?: string;
}
