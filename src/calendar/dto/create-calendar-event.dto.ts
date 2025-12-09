import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsISO8601,
  IsOptional,
} from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  id: string; 

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  startDateTime: string;

  @IsISO8601()
  endDateTime: string;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsISO8601()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  sourceModule?: string;

  @IsString()
  @IsOptional()
  eventStatus?: string;

  @IsISO8601()
  @IsOptional()
  createdAt?: string;

  @IsISO8601()
  @IsOptional()
  updatedAt?: string; 

  @IsString()
  @IsOptional()
  userId?: string;
}
