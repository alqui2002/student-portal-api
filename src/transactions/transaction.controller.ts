import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Headers,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionDto } from './dto/transaction.dto';
import * as jwt from 'jsonwebtoken';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) { }

  @Post('core-event')
  async receiveFromCore(@Body() body: any) {
    const payload: TransactionDto = body.payload || body;
    return this.txService.processCoreEvent(payload);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get()
  async findAll() {
    return this.txService.findAll();
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get('wallet')
  deposit(
    @Req() req,
  ) {
    const token = req.headers.authorization;
    const walletId = req.user?.wallet?.[0];
    return this.txService.findByWalletId(walletId);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    return this.txService.findOne(uuid);
  }
}
