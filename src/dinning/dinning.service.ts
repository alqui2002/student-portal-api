import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DinningReservation } from './entities/dinning-reservation.entity';
import { CreateDinningReservationDto } from './dto/create-dinning-reservation.dto';
import { UpdateDinningReservationDto } from './dto/update-dinning-reservation.dto';
import { User } from '../user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DinningService {
  constructor(
    @InjectRepository(DinningReservation)
    private readonly dinningRepository: Repository<DinningReservation>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ---------------------------------------------------------------------------
  // BASIC GETTERS
  // ---------------------------------------------------------------------------

  findAll() {
    return this.dinningRepository.find({ relations: ['user'] });
  }

  async findOne(id: string) {
    const reservation = await this.dinningRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async findByUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const reservations = await this.dinningRepository.find({
      where: { user: { id: userId } },
      order: { reservationDate: 'ASC' },
      relations: ['user'],
    });

    if (!reservations.length) {
      throw new NotFoundException('No reservations found for this user');
    }

    return reservations;
  }

  /**
   * Útil si mañana llegan eventos externos de "reservation.updated"
   * y solo te pasan reservationId y no tu UUID interno.
   */
  async findByReservationId(reservationId: number) {
    const reservation = await this.dinningRepository.findOne({
      where: { reservationId },
      relations: ['user'],
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation with reservationId ${reservationId} not found`,
      );
    }

    return reservation;
  }

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(dto: CreateDinningReservationDto) {
    const { userId, reservationId, ...rest } = dto;

    const reservation = this.dinningRepository.create({
      id: uuidv4(),
      reservationId: reservationId ?? null,
      locationId: rest.locationId,
      mealTime: rest.mealTime,
      reservationTimeSlot: rest.reservationTimeSlot ?? null,
      reservationDate: rest.reservationDate ?? new Date(),
      status: rest.status,
      cost: rest.cost,
      slotStartTime: rest.slotStartTime,
      slotEndTime: rest.slotEndTime,
    });

    if (rest.createdAt) {
      reservation.createdAt = rest.createdAt;
    }

    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      reservation.user = user;
    }

    return this.dinningRepository.save(reservation);
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(id: string, dto: UpdateDinningReservationDto) {
    const reservation = await this.findOne(id);

    const { reservationId, ...data } = dto;
    Object.assign(reservation, data);

    if (reservationId !== undefined) {
      reservation.reservationId = reservationId;
    }

    if (dto.reservationDate) {
      reservation.reservationDate = dto.reservationDate;
    }

    if (dto.createdAt) {
      reservation.createdAt = dto.createdAt;
    }

    if (dto.reservationTimeSlot !== undefined) {
      reservation.reservationTimeSlot = dto.reservationTimeSlot ?? null;
    }

    if (dto.slotStartTime) {
      reservation.slotStartTime = dto.slotStartTime;
    }

    if (dto.slotEndTime) {
      reservation.slotEndTime = dto.slotEndTime;
    }

    if (dto.userId) {
      const user = await this.userRepository.findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');
      reservation.user = user;
    }

    return this.dinningRepository.save(reservation);
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async remove(id: string) {
    const reservation = await this.findOne(id);
    await this.dinningRepository.remove(reservation);

    return { message: 'Reservation removed successfully' };
  }
}
