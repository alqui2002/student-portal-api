// calendar/dto/get-classes-by-commissions.dto.ts
import { IsArray, IsString } from 'class-validator';

export class GetClassesByCommissionsDto {
  @IsArray()
  @IsString({ each: true })
  commissionIds: string[];
}
