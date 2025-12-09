import { PartialType } from '@nestjs/mapped-types';
import { CreateDinningReservationDto } from './create-dinning-reservation.dto';

export class UpdateDinningReservationDto extends PartialType(CreateDinningReservationDto) {}
