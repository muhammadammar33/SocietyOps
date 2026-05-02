import { PropertyStatus, PropertyType } from '@prisma/client';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty()
  societyId!: string;

  @IsIn(['HOUSE', 'PLOT'])
  @IsOptional()
  type?: PropertyType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  block!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  houseNumber!: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  residentCount?: number;

  @IsIn(['OCCUPIED', 'VACANT', 'FOR_SALE', 'FOR_RENT'])
  @IsOptional()
  status?: PropertyStatus;
}
