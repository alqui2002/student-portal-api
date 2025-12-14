import { Controller, Post, Body, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CoreTransactionDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Post('core-event')
  async receiveFromCore(@Body() event: CoreTransactionDto) {
    return this.txService.processCoreEvent(event);
  }
}
