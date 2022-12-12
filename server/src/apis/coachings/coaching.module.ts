import { CoachingService } from './coaching.service';
import { CoachingController } from './coaching.controller';
import { Module } from '@nestjs/common';
import { ServiceModule } from 'src/services/service.module';
import { SetupService } from '../setup/setup.service';
import { AdvisorsService } from '../advisors/advisors.service';

@Module({
  imports: [ServiceModule],
  controllers: [CoachingController],
  providers: [CoachingService, SetupService, AdvisorsService],
})
export class CoachingModule {}
