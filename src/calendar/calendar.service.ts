import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CalendarEvent, EventType } from './entities/calendar-event.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { User } from '../user/entities/user.entity';
import axios from 'axios';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarRepository: Repository<CalendarEvent>,

  ) { }

  findAll(from?: string, to?: string, eventType?: string) {
    const query = this.calendarRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user');

    if (from) query.andWhere('event.startDateTime >= :from', { from });
    if (to) query.andWhere('event.endDateTime <= :to', { to });
    if (eventType) query.andWhere('event.eventType = :eventType', { eventType });

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
      event.user = { id: dto.userId } as User;
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
  async syncFromAcademic(userUuid: string, token: string) {
    const url =
      'https://eventos-academicos-service-1.onrender.com/api/events';

    const response = await axios.get(url, {
      params: { endDate: '2030-12-30' },
      headers: {
        authorization: `Bearer ${token}`,
        userid: userUuid,
      },
    });

    const events = Array.isArray(response.data) ? response.data : [];

    if (!events.length)
      return { success: true, inserted: 0, totalReceived: 0 };

    let inserted = 0;

    for (const ev of events) {
      const exists = await this.calendarRepository.findOne({
        where: { id: ev.id },
      });

      if (exists) continue;

      const newEvent = this.calendarRepository.create({
        id: ev.id,
        title: ev.name ?? '(Sin título)',
        description: ev.description ?? '',
        startDateTime: new Date(ev.startTime),
        endDateTime: new Date(ev.endTime),
        eventType: 'Evento',
        sourceModule: 'AcademicEvents',
        user: { id: userUuid },
        date: ev.startTime.substring(0, 10),
      });

      await this.calendarRepository.save(newEvent);
      inserted++;
    }

    return {
      success: true,
      inserted,
      totalReceived: events.length,
    };
  }
  async getClassesByCommissions(commissionIds: string[]) {
    const BASE_URL =
      'https://backoffice-production-df78.up.railway.app/api/v1/clases-individuales';

    const results = await Promise.all(
      commissionIds.map(async commissionId => {
        try {
          const { data } = await axios.get(BASE_URL, {
            params: {
              param: 'id_curso',
              value: commissionId,
            },
          });

          return {
            commissionId,
            classes: data,
          };
        } catch (error) {
          return {
            commissionId,
            error: true,
            message: error.message,
          };
        }
      })
    );

    return results;
  }
}
