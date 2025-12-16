import { Controller, Get, Post, Body, Param, UseGuards, Req, Headers } from '@nestjs/common';
import { AccountService } from './account.service';
import { DepositDto } from './dtos/account.dto';
import { ExternalJwtAuthGuard } from 'src/auth/external-jwt.guard'; // ✅ Usamos el Guard nuevo
import { User } from 'src/auth/user.decorator';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(ExternalJwtAuthGuard)
  @Get(':userId/balance')
  getBalance(@Param('userId') userId: string) {
    return this.accountService.getBalance(String(userId));
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Post(':userId/transactions')
  deposit(
    @Param('userId') userId: string,
    @Body() dto: DepositDto,
    @Req() req,
  ) {
    const token = req.headers.authorization;
    const walletId = req.user?.wallet?.[0]; 

    return this.accountService.deposit(userId, walletId, dto, token);
  }

  @Get('wallet/sync')
  @UseGuards(ExternalJwtAuthGuard)
  async syncStorePurchases(@User('sub') userUuid: string, @Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.accountService.syncWallet(userUuid, token);
  }

  @UseGuards(ExternalJwtAuthGuard)
  @Get('me')
  async getProfile(
    @User('sub') userUuid: string,
    @Req() req) {
    return this.accountService.getProfile(userUuid);
  }
}