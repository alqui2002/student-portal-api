import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DinningController } from './dinning.controller';
import { DinningService } from './dinning.service';
import { DinningReservation } from './entities/dinning-reservation.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DinningReservation, User])],
  controllers: [DinningController],
  providers: [DinningService],
})
export class DinningModule {}
