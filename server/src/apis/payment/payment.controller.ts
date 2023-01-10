/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionDto } from 'src/dtos/subscription.dto';
import { ResponseModel } from 'src/models/response.model';
import { PaymentService } from './payment.service';
import { Request } from 'express';
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get('userDetails/:userId')
  async userInfo(@Param('userId') userId: string): Promise<ResponseModel> {
    return await this.paymentService.userData(userId);
  }
  @Get('checkout/:userId/:subscriptionId')
  async checkout(
    @Param('userId') userId: string,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<ResponseModel> {
    return await this.paymentService.checkoutSession(userId, subscriptionId);
  }
  @Get('allPackages/:userId')
  async allPackaged(@Param('userId') userId: string): Promise<ResponseModel> {
    return await this.paymentService.userPackages(userId);
  }
  @Post('subscription')
  async createSubscription(
    @Body() subscription: SubscriptionDto,
  ): Promise<ResponseModel> {
    return await this.paymentService.createSubScription(subscription);
  }
  @Put('subscription')
  async updateSubscription(
    @Body() subscription: SubscriptionDto,
  ): Promise<ResponseModel> {
    return await this.paymentService.updateSubscription(subscription);
  }
  @Post('stripehook')
  async paymentSuccess(@Req() req: any, @Body() webhook: any): Promise<void> {
    return await this.paymentService.stripeWebHook(webhook, req);
  }
}
