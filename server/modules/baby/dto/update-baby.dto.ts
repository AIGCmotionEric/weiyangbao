import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateBabyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['boy', 'girl'])
  gender?: 'boy' | 'girl';

  @IsOptional()
  @IsString()
  birthday?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
