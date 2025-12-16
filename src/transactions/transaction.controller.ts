import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Post('core-event')
  async receiveFromCore(@Body() body: any) {
    // Si viene el evento completo, extraer solo el payload; si viene solo el payload, usarlo directamente
    const payload: TransactionDto = body.payload || body;
    return this.txService.processCoreEvent(payload);
  }

  @Get()
  async findAll() {
    return this.txService.findAll();
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    return this.txService.findOne(uuid);
  }
}
