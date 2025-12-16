import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios'; // Para tu método
import { firstValueFrom } from 'rxjs';       // Para tu método
import axios from 'axios';                   // Para el método de tus compañeros

import { Account } from './entities/account.entity';
import { User } from '../user/entities/user.entity';
import { DepositDto } from './dtos/account.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly httpService: HttpService, // Inyección necesaria para tu deposit
  ) {}

  async getBalance(userId: string) {
    const account = await this.accountRepo.findOne({ where: { user: { id: userId } } });
    if (!account) throw new NotFoundException('Account not found');
    return { balance: account.balance.toFixed(2) };
  }

  async deposit(
    userId: string,
    walletId: string,
    dto: DepositDto,
    token?: string,
  ) {

    if (!walletId) {
      throw new NotFoundException('Wallet not found in token');
    }
    
      const { amount, type, description, currency } = dto;
    
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let account = await this.accountRepo.findOne({ where: { user: { id: userId } } });
    if (!account) {
      account = this.accountRepo.create({ user, balance: 0 });
    }

    account.balance += amount; 
    await this.accountRepo.save(account);

    try {
      const coreUrl = process.env.HUB_URL ;

      const corePayload = {
        from: 'SYSTEM',
        to: walletId, 
        amount,
        currency: currency || 'ARG',
        type: type || 'CARGA_DE_SALDO',
        description: description || 'Transferencia recibida',
      };
      

      this.logger.log(`Enviando transacción al CORE: ${type} - $${amount}`);

      await firstValueFrom(
        this.httpService.post(
          `https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/transfers`, 
          corePayload,
          {
            headers: {
              Authorization: token, 
              'Content-Type': 'application/json'
            }
          }
        )
      );
      this.logger.log('✅ Transacción registrada en CORE exitosamente');

    } catch (error) {
      this.logger.error(`❌ Error al avisar al CORE: ${error.message}`);
    }

    return { balance: account.balance.toFixed(2) };
  }

  async syncWallet(userUuid: string, token: string) {
    const user = await this.userRepo.findOne({ where: { id: userUuid } });
    if (!user) throw new NotFoundException('User not found');

    // Nota: Ellos usan una URL hardcodeada. Idealmente deberíamos cambiarla a process.env.HUB_URL
    // pero por ahora dejémosla para no romper su lógica.
    const response = await axios.get(
      'https://jtseq9puk0.execute-api.us-east-1.amazonaws.com/api/wallets/mine',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const wallets = response.data?.data;
    if (!wallets || wallets.length === 0) {
      throw new NotFoundException('No wallet returned by CORE');
    }

    const coreBalance = parseFloat(wallets[0].balance);

    let account = await this.accountRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!account) {
      account = this.accountRepo.create({
        user,
        balance: coreBalance,
      });
    } else {
      account.balance = coreBalance;
    }

    await this.accountRepo.save(account);

    return {
      success: true,
      balance: coreBalance.toFixed(2),
    };
  }

  async getProfile(userUuid: string) {
    const user = await this.userRepo.findOne({
      where: { id: userUuid },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      name: user.name,
      email: user.email,
    };
  }
}