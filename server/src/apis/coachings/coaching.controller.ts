import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseModel } from 'src/models/response.model';
import { CoachingService } from './coaching.service';
@ApiTags('coachings')
@Controller('coachings')
export class CoachingController {
  constructor(private coachingService: CoachingService) {}

  @Get('userActionHabits/:userId')
  async actionHabits(@Param('userId') userId: string): Promise<ResponseModel> {
    return await this.coachingService.getActionAndHabits(userId);
  }
}
