import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeepCopyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  docId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  newPNo: number;
}
