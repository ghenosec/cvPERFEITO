import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  UseGuards,
  Headers,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private service: BillingService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  checkout(@Req() req: any) {
    return this.service.createCheckout(req.user.userId);
  }

  @Post('pix')
  @UseGuards(AuthGuard('jwt'))
  pix(@Req() req: any) {
    return this.service.createPixQrCode(req.user.userId);
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
    return this.service.handleWebhook(raw, signature);
  }
}
