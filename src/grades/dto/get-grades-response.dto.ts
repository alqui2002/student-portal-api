import { IsNumber, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CommissionDto {
  @IsString()
  id: string;

  @IsString()
  professor: string;

  @IsString()
  shift: string;

  @IsString()
  days: string;
}

export class GetGradesResponseDto {
  @ValidateNested()
  @Type(() => CommissionDto)
  commission: CommissionDto;

  @IsOptional()
  @IsNumber()
  firstExam?: number;

  @IsOptional()
  @IsNumber()
  secondExam?: number;

  @IsOptional()
  @IsNumber()
  finalExam?: number;

  @IsOptional()
  @IsNumber()
  recuExam?: number;

  @IsString()
  status: string;
}