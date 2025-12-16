import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class TransactionDto {
  @IsUUID()
  uuid: string;

  @IsOptional()
  @IsUUID()
  from_wallet_uuid?: string;

  @IsOptional()
  @IsUUID()
  to_wallet_uuid?: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsDateString()
  processed_at?: string;

  @IsOptional()
  @IsDateString()
  created_at?: string;

  @IsOptional()
  @IsDateString()
  updated_at?: string;
}
