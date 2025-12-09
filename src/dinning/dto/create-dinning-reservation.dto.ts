import {
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SlotTimeDto {
  @IsNumber()
  hour: number;

  @IsNumber()
  minute: number;

  @IsNumber()
  second: number;

  @IsNumber()
  nano: number;
}

export class CreateDinningReservationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  locationId: string;

  @IsString()
  @IsNotEmpty()
  mealTime: string;

  @IsString()
  @IsNotEmpty()
  reservationTimeSlot: string;

  @IsISO8601()
  reservationDate: string;

  @IsString()
  status: string;

  @IsNumber()
  cost: number;

  @ValidateNested()
  @Type(() => SlotTimeDto)
  slotStartTime: SlotTimeDto;

  @ValidateNested()
  @Type(() => SlotTimeDto)
  slotEndTime: SlotTimeDto;
}
