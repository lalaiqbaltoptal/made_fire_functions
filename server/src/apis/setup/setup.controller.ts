import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeepCopyDto } from 'src/dtos/deep-copy.dto';
import { ResponseModel } from 'src/models/response.model';
import { SetupService } from './setup.service';
@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private setupService: SetupService) {}
  @Get('endnodes')
  async getEndNodes(): Promise<ResponseModel> {
    return await this.setupService.getEndNodes();
  }

  @Get('predecessorsList/:id')
  async getPredecessors(@Param('id') id: string): Promise<ResponseModel> {
    return await this.setupService.predecessorList(id);
  }

  @Delete(':id')
  async deletePredecessor(@Param('id') id: string): Promise<ResponseModel> {
    return await this.setupService.deepDeleteSetup(id);
  }

  @Put('copy')
  async createDeepCopy(@Body() copyDto: DeepCopyDto): Promise<ResponseModel> {
    return await this.setupService.deepCopy(copyDto);
  }
}
