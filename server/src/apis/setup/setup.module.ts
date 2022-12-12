import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ServiceModule } from 'src/services/service.module';

@Module({
  imports: [ServiceModule],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
