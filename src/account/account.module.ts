import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; // <--- Vital para que funcione tu inyección

import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { Account } from './entities/account.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User]),
    HttpModule, // <--- Obligatorio porque el Servicio usa HttpService
  ],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}