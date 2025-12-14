import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CoreEnrollmentDto {
  @IsUUID()
  uuid: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  status: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  endDate?: string | null;
}
