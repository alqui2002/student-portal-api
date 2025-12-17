import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarEvent } from './entities/calendar-event.entity';
import { User } from '../user/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { CalendarSyncService } from './calendar-sync.service';
import { EnrollmentsModule } from '../enrollment/enrollment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarEvent]),
    HttpModule,
    User,
    EnrollmentsModule, // 👈 CLAVE

  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    CalendarSyncService, // 👈 ESTO FALTABA
  ],
})
export class CalendarModule {}

