import { PaymentModule } from './apis/payment/payment.module';
import { CoachingModule } from './apis/coachings/coaching.module';
import { AdvisorsModule } from './apis/advisors/advisors.module';
import { SetupModule } from './apis/setup/setup.module';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceModule } from './services/service.module';
import { StripeModule } from 'nestjs-stripe';
import { Environment } from './config/enviroment';

@Module({
  imports: [
    StripeModule.forRoot({
      apiKey: Environment.stripeSecretKey,
      apiVersion: '2022-11-15' as unknown as any,
    }),
    PaymentModule,
    CoachingModule,
    AdvisorsModule,
    SetupModule,
    ServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
