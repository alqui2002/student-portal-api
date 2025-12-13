import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateCourseDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  correlates?: string[];
}
