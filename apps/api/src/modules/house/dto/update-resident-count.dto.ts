import { IsInt, Min } from 'class-validator';

export class UpdateResidentCountDto {
  @IsInt()
  @Min(0)
  residentCount!: number;
}
