import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdvisorPrefDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  ageUpper: number;
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  ageLower: number;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ethnicity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gender: string;
}
