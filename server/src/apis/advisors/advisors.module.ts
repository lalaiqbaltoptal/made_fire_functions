import { AdvisorsService } from './advisors.service';
import { AdvisorsController } from './advisors.controller';
import { Module } from '@nestjs/common';
import { ServiceModule } from 'src/services/service.module';

@Module({
  imports: [ServiceModule],
  controllers: [AdvisorsController],
  providers: [AdvisorsService],
})
export class AdvisorsModule {}
