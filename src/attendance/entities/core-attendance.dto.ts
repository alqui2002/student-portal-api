import { IsUUID, IsString, IsIn } from 'class-validator';

export class AttendanceFromCoreDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  date: string; 

  @IsIn(['P', 'A', 'M'])
  status: 'P' | 'A' | 'M';
}
