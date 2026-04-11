import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PLANS } from '../commom/plans.config';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly api: AxiosInstance;

  constructor(private prisma: PrismaService) {
    this.api = axios.create({
      baseURL: process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com/v1',
      headers: {
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createPixForPlan(userId: string, targetPlan: 'BASIC' | 'PREMIUM') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const planOrder = { FREE: 0, BASIC: 1, PREMIUM: 2 };
    if (planOrder[user.plan] > planOrder[targetPlan]) {
      throw new ForbiddenException(
        'Downgrade não é permitido. Você já possui um plano superior.',
      );
    }

    const planConfig = PLANS[targetPlan];
    if (!planConfig || planConfig.priceCents === 0) {
      throw new BadRequestException('Plano inválido');
    }

    try {
      const { data } = await this.api.post('/pixQrCode/create', {
        amount: planConfig.priceCents,
        expiresIn: 3600,
        description: `cvPERFEITO - Plano ${planConfig.name}`,
        customer: {
          name: user.name,
          email: user.email,
          cellphone: '(11) 4002-8922',
          taxId: '111.444.777-35',
        },
        metadata: {
          externalId: `cvperfeito_${userId}_${targetPlan}_${Date.now()}`,
        },
      });

      const pix = data?.data || data;

      const payment = await this.prisma.payment.create({
        data: {
          userId,
          abacateId: pix.id,
          amountCents: planConfig.priceCents,
          status: 'PENDING',
          planGranted: targetPlan as Plan,
          creditsGranted: planConfig.credits,
          pixQrCode: pix.brCodeBase64,
          pixCopyPaste: pix.brCode,
        },
      });

      return {
        paymentId: payment.id,
        abacateId: pix.id,
        amount: planConfig.priceCents,
        planName: planConfig.name,
        plan: targetPlan,
        credits: planConfig.credits,
        qrCodeBase64: pix.brCodeBase64,
        copyPaste: pix.brCode,
        expiresAt: pix.expiresAt,
        status: pix.status,
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(
        'AbacatePay pixQrCode/create failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Falha ao gerar PIX.');
    }
  }

  async simulatePayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException();

    try {
      await this.api.post('/pixQrCode/simulate-payment', null, {
        params: { id: payment.abacateId },
      });
      await this.applyPayment(payment.id);
      return { ok: true };
    } catch (err: any) {
      this.logger.error(
        'AbacatePay simulate-payment failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Falha ao simular pagamento.');
    }
  }

  async checkPaymentStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException();

    try {
      const { data } = await this.api.get('/pixQrCode/check', {
        params: { id: payment.abacateId },
      });
      const status = (data?.data?.status || data?.status || '').toUpperCase();

      if (status === 'PAID' && payment.status !== 'PAID') {
        await this.applyPayment(payment.id);
      }

      const updated = await this.prisma.payment.findUnique({
        where: { id: payment.id },
      });
      return { status: updated?.status, abacateStatus: status };
    } catch {
      return { status: payment.status };
    }
  }

  async listPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleWebhook(rawBody: Buffer | string, signature?: string) {
  const body =
    typeof rawBody === 'string' ? rawBody : rawBody?.toString('utf-8') || '';

  const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    if (signature !== expected) {
      this.logger.warn('Webhook rejected: invalid signature');
      throw new BadRequestException('Invalid webhook signature');
    }
  } else if (webhookSecret && !signature) {
    this.logger.warn('Webhook rejected: missing signature');
    throw new BadRequestException('Missing webhook signature');
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new BadRequestException('Invalid webhook payload');
  }

  this.logger.log(`Webhook received: ${payload.event}`);

  const event = payload.event || payload.type;
  const data = payload.data || payload;

  if (event === 'billing.paid' || event === 'pix.paid' || data?.status === 'PAID') {
    const abacateId = data.id || data.billing?.id || data.pixQrCode?.id;
    if (!abacateId) return { ok: false, reason: 'no id' };

    const payment = await this.prisma.payment.findUnique({
      where: { abacateId },
    });
    if (!payment) return { ok: false, reason: 'payment not found' };

    if (payment.status !== 'PAID') {
      await this.applyPayment(payment.id);
    }
    return { ok: true };
  }

  if (event === 'billing.failed' || data?.status === 'FAILED') {
    const abacateId = data.id;
    if (abacateId) {
      await this.prisma.payment.updateMany({
        where: { abacateId },
        data: { status: 'FAILED' },
      });
    }
  }

  return { ok: true };
}

  private async applyPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID' },
      }),
      this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.planGranted,
          creditsLeft: payment.creditsGranted,
        },
      }),
    ]);

    this.logger.log(
      `Payment ${paymentId} applied: user ${payment.userId} → plan ${payment.planGranted} with ${payment.creditsGranted} credits`,
    );
  }
}