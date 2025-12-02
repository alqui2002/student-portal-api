import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CalendarEvent, EventType } from './entities/calendar-event.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarRepository: Repository<CalendarEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(from?: string, to?: string, eventType?: string) {
    const query = this.calendarRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user');

    if (from) query.andWhere('event.startDateTime >= :from', { from });
    if (to) query.andWhere('event.endDateTime <= :to', { to });
    if (eventType)
      query.andWhere('event.eventType = :eventType', { eventType });

    return query.getMany();
  }

  async findOne(id: string) {
    const event = await this.calendarRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findByUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const events = await this.calendarRepository.find({
      where: [
        { user: { id: userId } },
        { user: IsNull() },
      ],
      order: { date: 'ASC' },
      relations: ['user'],
    });

    if (!events.length)
      throw new NotFoundException('No events found for this user');

    return events;
  }

  async create(dto: CreateCalendarEventDto) {
    const event = this.calendarRepository.create(dto);

    if (dto.userId) {
      const user = await this.userRepository.findOneBy({ id: dto.userId });
      if (user) event.user = user;
    }

    return this.calendarRepository.save(event);
  }

  async update(id: string, dto: Partial<CreateCalendarEventDto>) {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    return this.calendarRepository.save(event);
  }

  async cancel(id: string) {
    const event = await this.findOne(id);
    event.eventType = EventType.Cancelled;
    return this.calendarRepository.save(event);
  }

  async updateStatus(id: string, status: string) {
    const event = await this.calendarRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    event.eventStatus = status;
    return this.calendarRepository.save(event);
  }
}