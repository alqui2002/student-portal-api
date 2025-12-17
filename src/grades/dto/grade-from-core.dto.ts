import { IsUUID, IsNumber, Min, Max, IsIn } from 'class-validator';

export class GradeFromCoreDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsIn(['PARCIAL_1', 'PARCIAL_2', 'FINAL', 'RECUPERATORIO'])
  examType: 'PARCIAL_1' | 'PARCIAL_2' | 'FINAL' | 'RECUPERATORIO';

  @IsNumber()
  @Min(0)
  @Max(10)
  grade: number;
}
