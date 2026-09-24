import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBabyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsIn(['boy', 'girl'])
  gender!: 'boy' | 'girl';

  @IsString()
  birthday!: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
