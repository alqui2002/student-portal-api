import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Purchase } from 'src/purchases/entities/purchase.entity';
import { Repository } from 'typeorm';
import { CoreTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
  ) {}

  async processCoreEvent(event: CoreTransactionDto) {
    console.log('Processing core event:', event);
    const exists = await this.purchaseRepo.findOne({
      where: { id: event.uuid },
    });

    if (exists) {
      return exists;
    }

    const product = [
        {
          name: event.description, 
          type: event.type,        
        }
      ];

    const purchase = this.purchaseRepo.create({
        id: event.uuid,  
        date: event.processed_at,
        total: String(event.amount), 
        product: product,
      });
      

    return await this.purchaseRepo.save(purchase);
  }
}
