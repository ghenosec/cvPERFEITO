import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Post('checkout/:plan')
  @UseGuards(AuthGuard('jwt'))
  checkout(@Param('plan') plan: 'BASIC' | 'PREMIUM', @Req() req: any) {
    return this.billing.createCheckout(req.user.userId, plan);
  }

  @Get('payments')
  @UseGuards(AuthGuard('jwt'))
  getPayments(@Req() req: any) {
    return this.billing.getPayments(req.user.userId);
  }

  @Get('payments/:id/check')
  @UseGuards(AuthGuard('jwt'))
  checkPayment(@Param('id') id: string, @Req() req: any) {
    return this.billing.checkPayment(id, req.user.userId);
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.billing.handleWebhook(body);
  }
}