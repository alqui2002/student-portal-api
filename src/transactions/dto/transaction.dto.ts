import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CoreTransactionDto {
  @IsUUID()
  uuid: string;

  @IsString()
  amount: string;

  @IsString()
  processed_at: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  from_wallet_uuid?: string;

  @IsOptional()
  to_wallet_uuid?: string;

  @IsOptional()
  currency?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  created_at?: string;

  @IsOptional()
  updated_at?: string;
}
