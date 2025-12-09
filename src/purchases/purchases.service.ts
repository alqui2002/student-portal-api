import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { User } from '../user/entities/user.entity';
import axios from 'axios';
import { Purchase } from './entities/purchase.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}


  async create(userId: string, dto: CreatePurchaseDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const purchase = this.purchaseRepo.create({
      user,
      product: dto.product, 
      total: dto.total,
    });

    return this.purchaseRepo.save(purchase);
  }

  async findByUser(userId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { user: { id: userId } },
      order: { date: 'DESC' },
    });

    if (!purchases.length) {
      throw new NotFoundException('No purchases found for this user');
    }

    return purchases.map((p) => ({
      id: p.id,
      product: p.product,
      date: p.date,
      total: p.total,
    }));
  }
  async syncTransfers(userUuid: string, token: string) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userUuid } });
  
      if (!user) throw new Error('Usuario no encontrado');
  
      const response = await axios.get(
        'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/transfers/mine',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
  
      const transfers = response.data.data;
  
      const saved: Purchase[] = [];

      for (const t of transfers) {
        const purchase = this.purchaseRepo.create({
          user,
          product: [
            {
              name: t.description,
              description: 'Transferencia CORE',
              productCode: t.to_wallet_uuid,
              subtotal: t.amount,
              quantity: 1,
            },
          ],
          total: t.amount,
        });

        const inserted = await this.purchaseRepo.save(purchase);
        saved.push(inserted); 
      }

  
      return saved;
  
    } catch (err) {
      console.error(err);
      throw new Error('Error al sincronizar transferencias');
    }
  }
  async syncStorePurchases(userUuid: string, token: string) {
    const user = await this.userRepo.findOne({ where: { id: userUuid } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { data: orders } = await axios.get(
      `https://uadestore.onrender.com/api/orders/me?userId=${userUuid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const existing = await this.purchaseRepo.find({
      where: { user: { id: user.id } },
    });

    const existingDates = new Set(existing.map((p) => p.date.toISOString()));

    const savedPurchases: Purchase[] = [];

    for (const order of orders) {
      const orderDateISO = new Date(order.created_at).toISOString();
      if (existingDates.has(orderDateISO)) continue;

      const items = order.Item_compra ?? [];

      if (items.length === 0) {
        const purchase = this.purchaseRepo.create({
          user,
          total: order.total_compra.toString(),
          date: new Date(order.created_at),
          product: [
            {
              name: "Compra UADE Store",
              description: "Sin detalles",
              productCode: `store-${order.id}`,
              subtotal: order.total_compra.toString(),
              quantity: 1,
            },
          ],
        });

        const saved = await this.purchaseRepo.save(purchase);
        savedPurchases.push(saved);
        continue;
      }

      const productArray = items.map((item) => {
        const articulo = item?.Stock?.Articulo;
      
        return {
          name: articulo?.Titulo ?? "Producto UADE Store",
          description: articulo?.descripcion ?? "Sin descripción",
          productCode: `store-${item.id}`,
          subtotal: item?.subtotal?.toString(),
          quantity: item?.cantidad ?? 1,
        };
      });
      

      const purchase = this.purchaseRepo.create({
        user,
        total: order.total_compra.toString(),
        date: new Date(order.created_at),
      });
      

      const saved = await this.purchaseRepo.save(purchase);
      savedPurchases.push(saved);
    }

    return {
      success: true,
      inserted: savedPurchases.length,
      purchases: savedPurchases,
    };
  }
  
}
