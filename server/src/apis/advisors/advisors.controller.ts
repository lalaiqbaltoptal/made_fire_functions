import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdvisorPrefDto } from 'src/dtos/advisor_pref_body';
import { ResponseModel } from 'src/models/response.model';
import { AdvisorsService } from './advisors.service';
@ApiTags('advisors')
@Controller('advisors')
export class AdvisorsController {
  constructor(private advisorService: AdvisorsService) {}

  @Get('options')
  async getAvailableOptions(): Promise<ResponseModel> {
    return await this.advisorService.getAdvisorsOptions();
  }

  // @Put()
  // async getAdvisors(@Body() pref: AdvisorPrefDto): Promise<ResponseModel> {
  //   return await this.advisorService.getAdvisorsList(pref);
  // }
}
