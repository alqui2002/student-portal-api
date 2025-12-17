import { IsString, IsNumber, Matches, IsNotEmpty, IsOptional } from 'class-validator';

export class DepositDto {
  @IsNumber()
  amount: number;

  @Matches(/^\d{16}$/, { message: 'Card number must have 16 digits' })
  cardNumber: string;

  @Matches(/^(0[1-9]|1[0-2])\/(\d{2})$/, { message: 'Expiration must be MM/YY' })
  expiration: string;

  @Matches(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits' })
  cvv: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}