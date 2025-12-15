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
    // Verificamos si el usuario existe (opcional, pero recomendado)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const reservations = await this.dinningRepository.find({
      where: { user: { id: userId } },
      order: { reservationDate: 'ASC' },
      relations: ['user'],
    });

    // ✅ CORRECCIÓN IMPORTANTE:
    // Si no hay reservas, devolvemos un array vacío [] en lugar de lanzar error.
    // Esto evita que el Frontend se rompa.
    return reservations || [];
  }

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

    // Creamos la instancia. Nota: slotStartTime y slotEndTime se guardan directo
    // porque tu Entity usa type: 'jsonb', lo cual es compatible con el objeto del DTO.
    const reservation = this.dinningRepository.create({
      id: uuidv4(),
      reservationId: reservationId ?? null,
      locationId: rest.locationId,
      mealTime: rest.mealTime,
      reservationTimeSlot: rest.reservationTimeSlot ?? null,
      reservationDate: rest.reservationDate,
      status: rest.status,
      cost: rest.cost,
      slotStartTime: rest.slotStartTime,
      slotEndTime: rest.slotEndTime,
      createdAt: rest.createdAt ?? new Date(),
    });

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

    // ✅ CORRECCIÓN DE ERRORES DE SINTAXIS Y TIPADO
    // TypeScript ahora reconocerá estas propiedades gracias a que instalaste @nestjs/mapped-types
    
    if (dto.reservationId !== undefined) reservation.reservationId = dto.reservationId;
    if (dto.reservationDate) reservation.reservationDate = dto.reservationDate;
    if (dto.mealTime) reservation.mealTime = dto.mealTime; // Estaba mal escrito "meal Time"
    if (dto.status) reservation.status = dto.status;
    
    // Mapeo del resto de campos opcionales
    if (dto.locationId !== undefined) reservation.locationId = dto.locationId;
    if (dto.reservationTimeSlot !== undefined) reservation.reservationTimeSlot = dto.reservationTimeSlot;
    if (dto.cost !== undefined) reservation.cost = dto.cost;
    if (dto.slotStartTime) reservation.slotStartTime = dto.slotStartTime;
    if (dto.slotEndTime) reservation.slotEndTime = dto.slotEndTime;

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