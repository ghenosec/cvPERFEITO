import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly api: AxiosInstance;
  private readonly priceCents: number;

  constructor(private prisma: PrismaService) {
    this.priceCents = Number(process.env.PRICE_PER_USE_CENTS || 500);
    this.api = axios.create({
      baseURL: process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com/v1',
      headers: {
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createCheckout(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const externalId = `cvperfeito_${userId}_${Date.now()}`;

    try {
      const { data } = await this.api.post('/billing/create', {
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [
          {
            externalId: 'cv-analysis',
            name: 'cvPERFEITO - Análise de Currículo',
            description: '1 análise completa com 5 IAs + carta de apresentação',
            quantity: 1,
            price: this.priceCents,
          },
        ],
        returnUrl: `${process.env.FRONTEND_URL}/billing`,
        completionUrl: `${process.env.FRONTEND_URL}/billing/success`,
        customer: {
          name: user.name,
          email: user.email,
          cellphone: '(11) 99999-9999',
          taxId: '000.000.000-00',
        },
        metadata: {
          externalId,
        },
      });

      const billing = data?.data || data;

      const payment = await this.prisma.payment.create({
        data: {
          userId,
          abacateId: billing.id,
          amountCents: this.priceCents,
          status: 'PENDING',
          creditsGranted: 1,
        },
      });

      return {
        paymentId: payment.id,
        abacateId: billing.id,
        url: billing.url,
        amount: this.priceCents,
        status: billing.status,
      };
    } catch (err: any) {
      this.logger.error(
        'AbacatePay billing/create failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException(
        'Falha ao criar cobrança. Verifique sua chave AbacatePay.',
      );
    }
  }

  async createPixQrCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    try {
      const { data } = await this.api.post('/pixQrCode/create', {
        amount: this.priceCents,
        expiresIn: 3600,
        description: 'cvPERFEITO - 1 análise de currículo',
        customer: {
          name: user.name,
          email: user.email,
          cellphone: '(11) 99999-9999',
          taxId: '000.000.000-00',
        },
        metadata: {
          externalId: `cvperfeito_${userId}_${Date.now()}`,
        },
      });

      const pix = data?.data || data;

      const payment = await this.prisma.payment.create({
        data: {
          userId,
          abacateId: pix.id,
          amountCents: this.priceCents,
          status: 'PENDING',
          creditsGranted: 1,
          pixQrCode: pix.brCodeBase64,
          pixCopyPaste: pix.brCode,
        },
      });

      return {
        paymentId: payment.id,
        abacateId: pix.id,
        amount: this.priceCents,
        qrCodeBase64: pix.brCodeBase64,
        copyPaste: pix.brCode,
        expiresAt: pix.expiresAt,
        status: pix.status,
      };
    } catch (err: any) {
      this.logger.error(
        'AbacatePay pixQrCode/create failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Falha ao gerar PIX.');
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
        await this.markAsPaid(payment.id, payment.userId, payment.creditsGranted);
      }

      return { status: payment.status, abacateStatus: status };
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
        await this.markAsPaid(payment.id, payment.userId, payment.creditsGranted);
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

  private async markAsPaid(paymentId: string, userId: string, credits: number) {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID' },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { creditsLeft: { increment: credits } },
      }),
    ]);
    this.logger.log(`Payment ${paymentId} marked as PAID, +${credits} credits`);
  }
}
