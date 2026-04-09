import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  UseGuards,
  Headers,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private service: BillingService) {}

  @Post('checkout/:plan')
  @UseGuards(AuthGuard('jwt'))
  checkout(@Param('plan') plan: string, @Req() req: any) {
    const normalized = plan.toUpperCase();
    if (normalized !== 'BASIC' && normalized !== 'PREMIUM') {
      throw new BadRequestException('Plano inválido. Use BASIC ou PREMIUM.');
    }
    return this.service.createPixForPlan(
      req.user.userId,
      normalized as 'BASIC' | 'PREMIUM',
    );
  }

  @Post('payments/:id/simulate')
  @UseGuards(AuthGuard('jwt'))
  simulate(@Param('id') id: string, @Req() req: any) {
    return this.service.simulatePayment(req.user.userId, id);
  }

  @Get('payments')
  @UseGuards(AuthGuard('jwt'))
  payments(@Req() req: any) {
    return this.service.listPayments(req.user.userId);
  }

  @Get('payments/:id/check')
  @UseGuards(AuthGuard('jwt'))
  check(@Param('id') id: string, @Req() req: any) {
    return this.service.checkPaymentStatus(req.user.userId, id);
  }

  @Post('webhook')
  webhook(
    @Req() req: any,
    @Headers('x-abacatepay-signature') signature: string,
    @Body() body: any,
  ) {
    const raw = req.body instanceof Buffer ? req.body : JSON.stringify(body || {});
    return this.service.handleWebhook(raw);
  }
}