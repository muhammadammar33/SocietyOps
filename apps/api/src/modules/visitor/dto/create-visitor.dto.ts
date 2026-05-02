import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateVisitorDto {
  @IsUUID()
  houseId: string;

  @IsString()
  visitorName: string;

  @IsDateString()
  entryTime: string;

  @IsOptional()
  @IsDateString()
  exitTime?: string;

  @IsOptional()
  @IsUUID()
  approvedById?: string;
}
