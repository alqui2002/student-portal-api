import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  reservationId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return String(value);
  })
  locationId: string;

  @IsString()
  @IsNotEmpty()
  mealTime: string;

  @IsString()
  @IsOptional()
  reservationTimeSlot?: string | null;

  @IsDate()
  @Transform(({ value }) => transformToDate(value))
  reservationDate: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => transformToDate(value))
  createdAt?: Date;

  @IsString()
  status: string;

  @IsNumber()
  cost: number;

  @ValidateNested()
  @Type(() => SlotTimeDto)
  @Transform(({ value }) => transformSlotTime(value))
  slotStartTime: SlotTimeDto;

  @ValidateNested()
  @Type(() => SlotTimeDto)
  @Transform(({ value }) => transformSlotTime(value))
  slotEndTime: SlotTimeDto;
}

function transformToDate(value: unknown): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = value;
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
  }

  const parsed = new Date(value as string);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return undefined;
}

function transformSlotTime(value: unknown): SlotTimeDto | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const [hour = 0, minute = 0, second = 0, nano = 0] = value as number[];
    return { hour, minute, second, nano };
  }

  if (typeof value === 'object') {
    return value as SlotTimeDto;
  }

  return undefined;
}
