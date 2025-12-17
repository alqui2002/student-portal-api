import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EnrollmentsService } from "src/enrollment/enrollment.service";
import { CalendarEvent } from "./entities/calendar-event.entity";
import { Repository } from "typeorm";
import { firstValueFrom } from "rxjs";

const EXAM_TYPES = [
  "parcial_1",
  "parcial_2",
  "final",
  "recuperatorio",
];


@Injectable()
export class CalendarSyncService {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly http: HttpService,

    @InjectRepository(CalendarEvent)
    private readonly calendarRepo: Repository<CalendarEvent>,
  ) {}

  async syncUserCalendar(userId: string) {
    const enrollments = await this.enrollmentsService.findByUser(userId);

    for (const enrollment of enrollments) {
      const commissionId = enrollment.commission.id;
      console.log('https://backoffice-production-df78.up.railway.app/api/v1/clases-individuales/param=id_curso&value=' + commissionId);
      const { data: classes } = await firstValueFrom(
        this.http.get(
          `https://backoffice-production-df78.up.railway.app/api/v1/clases-individuales/param=id_curso&value=${commissionId}`
        )
      );

      for (const clase of classes) {
        if (!EXAM_TYPES.includes(clase.tipo)) continue;

        await this.createIfNotExists(userId, enrollment, clase);
      }
    }

    return { synced: true };
  }

  private async createIfNotExists(
    userId: string,
    enrollment: any,
    clase: any,
  ) {
    const title = `${enrollment.course.name} – ${clase.titulo}`;
    const date = clase.fecha_clase;

    const exists = await this.calendarRepo.findOne({
        where: {
            user: { id: userId },
            title,
            date,
        },
        });

    if (exists) return;

    await this.calendarRepo.save({
      userId,
      title,
      description: `Examen ${clase.tipo.replace("_", " ")}`,
      date,
      eventType: "examen",
    });
  }
}
