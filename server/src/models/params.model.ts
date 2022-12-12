import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
export class QueryParms {
  @ApiPropertyOptional()
  @IsOptional()
  pageSize: string;

  @ApiPropertyOptional()
  @IsOptional()
  pageNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  search: string;
}
