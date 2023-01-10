import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ServiceModule } from 'src/services/service.module';
import { StripeModule } from 'nestjs-stripe';

@Module({
  imports: [ServiceModule, StripeModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
