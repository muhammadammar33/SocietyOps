import { BillingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBillingDto {
  @IsString()
  houseId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  description!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsEnum(BillingStatus)
  @IsOptional()
  status?: BillingStatus;
}
