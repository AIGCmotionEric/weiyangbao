import { IsIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import type { FeedingRecord } from '@shared/api.interface';

export class CreateFeedingDto implements Omit<FeedingRecord, 'id' | 'createdAt' | 'updatedAt'> {
  @IsUUID()
  babyId!: string;

  @IsString()
  @IsIn(['breast_milk', 'formula', 'solid_food'])
  type!: 'breast_milk' | 'formula' | 'solid_food';

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  feedingTime!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
