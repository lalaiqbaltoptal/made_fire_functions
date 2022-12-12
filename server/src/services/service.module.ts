import { Module } from '@nestjs/common';
import { FireAdminService } from './fire-admin.service';

import { HttpModule } from '@nestjs/common/http';
@Module({
  imports: [HttpModule],
  providers: [FireAdminService],
  exports: [FireAdminService],
})
export class ServiceModule {}
