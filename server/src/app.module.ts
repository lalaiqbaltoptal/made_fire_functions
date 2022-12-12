import { CoachingModule } from './apis/coachings/coaching.module';
import { AdvisorsModule } from './apis/advisors/advisors.module';
import { SetupModule } from './apis/setup/setup.module';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceModule } from './services/service.module';

@Module({
  imports: [CoachingModule, AdvisorsModule, SetupModule, ServiceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
