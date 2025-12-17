import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) { }

  async processCoreEvent(payload: TransactionDto) {
    const exists = await this.transactionRepo.findOne({
      where: { uuid: payload.uuid },
    });

    if (exists) {
      return exists;
    }
    const transaction = this.transactionRepo.create({
      uuid: payload.uuid,
      from_wallet_uuid: payload.from_wallet_uuid,
      to_wallet_uuid: payload.to_wallet_uuid,
      amount: payload.amount,
      currency: payload.currency,
      type: payload.type,
      status: payload.status,
      description: payload.description,
      metadata: payload.metadata,
      processed_at: payload.processed_at ? new Date(payload.processed_at) : undefined,
      created_at: payload.created_at ? new Date(payload.created_at) : new Date(),
      updated_at: payload.updated_at ? new Date(payload.updated_at) : new Date(),
    });

    return await this.transactionRepo.save(transaction);
  }

  async findAll() {
    return this.transactionRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findByWalletId(walletId: string) {
    return this.transactionRepo.find({
      where: [
        { from_wallet_uuid: walletId },
        { to_wallet_uuid: walletId },
      ],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(uuid: string) {
    return this.transactionRepo.findOne({
      where: { uuid },
    });
  }
}
