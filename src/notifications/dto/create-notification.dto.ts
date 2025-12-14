import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotiType} from '../entities/notifications.entity';

export class CreateNotificationDto {
  
  @IsUUID()
  @IsNotEmpty()
  userId: string;
  
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotiType)
  type: NotiType;
}
