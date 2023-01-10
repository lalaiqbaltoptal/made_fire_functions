import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  contains,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SubscriptionInterval } from 'src/constants/subscription.interval';

export class SubscriptionDto {
  id: string;
  @ApiPropertyOptional()
  @IsNotEmpty()
  title: string;
  @IsNotEmpty()
  @ApiPropertyOptional()
  description: string;
  discount: number;
  trialPeriod: number;
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  @Max(100)
  @Min(0)
  percentageBaseValue: number;
  @ApiPropertyOptional()
  interval: string;

  stripeProductId: string;
}
