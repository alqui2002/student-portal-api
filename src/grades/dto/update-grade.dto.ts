import { IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  firstExam?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  secondExam?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  finalExam?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  recuExam?: number;

  @IsOptional()
  @IsIn(['in_progress', 'passed', 'failed'])
  status?: 'in_progress' | 'passed' | 'failed';
}
