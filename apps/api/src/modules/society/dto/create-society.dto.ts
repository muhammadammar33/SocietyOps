import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSocietyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location!: string;
}
