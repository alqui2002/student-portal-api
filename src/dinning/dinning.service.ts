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

  findAll() {
    return this.dinningRepository.find({ relations: ['user'] });
  }

  async findOne(id: string) {
    const reservation = await this.dinningRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
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

  async create(dto: CreateDinningReservationDto) {
    const reservation = this.dinningRepository.create({
      id: uuidv4(),
      ...dto,
      reservationDate: new Date(dto.reservationDate),
    });

    if (dto.userId) {
      const user = await this.userRepository.findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');
      reservation.user = user;
    }

    return this.dinningRepository.save(reservation);
  }

  async update(id: string, dto: UpdateDinningReservationDto) {
    const reservation = await this.findOne(id);
    Object.assign(reservation, dto);

    if (dto.reservationDate) {
      reservation.reservationDate = new Date(dto.reservationDate);
    }

    if (dto.userId) {
      const user = await this.userRepository.findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');
      reservation.user = user;
    }

    return this.dinningRepository.save(reservation);
  }

  async remove(id: string) {
    const reservation = await this.findOne(id);
    await this.dinningRepository.remove(reservation);
    return { message: 'Reservation removed successfully' };
  }
}
