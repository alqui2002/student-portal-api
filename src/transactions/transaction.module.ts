import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Purchase } from '../purchases/entities/purchase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase])],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
