import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

import type { GrowthRecord } from '@shared/api.interface';

export class CreateGrowthDto implements Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'> {
  @IsString()
  babyId!: string;

  @IsNumber()
  @IsPositive()
  height!: number;

  @IsNumber()
  @IsPositive()
  weight!: number;

  @IsString()
  measureDate!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
