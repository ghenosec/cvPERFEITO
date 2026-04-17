import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';

const PLAN_CONFIG = {
  BASIC: { amount: 4.9, credits: 5, label: 'Básico' },
  PREMIUM: { amount: 9.9, credits: 15, label: 'Premium' },
};

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private mp: MercadoPagoService,
  ) {}

  async createCheckout(userId: string, plan: 'BASIC' | 'PREMIUM') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const config = PLAN_CONFIG[plan];

    const mpPayment = await this.mp.createPixPayment(
      config.amount,
      `cvPERFEITO - Plano ${config.label} (${config.credits} créditos)`,
      user.email,
    );

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        mercadoPagoId: mpPayment.id?.toString(),
        amountCents: Math.round(config.amount * 100),
        status: 'PENDING',
        planGranted: plan,
        creditsGranted: config.credits,
        pixQrCode: mpPayment.qr_code,
        pixCopyPaste: mpPayment.qr_code,
      },
    });

    return {
      paymentId: payment.id,
      qrCode: mpPayment.qr_code,
      qrCodeBase64: mpPayment.qr_code_base64,
      amount: config.amount,
      planName: config.label,
      credits: config.credits,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async checkPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    if (payment.status !== 'PENDING') return { status: payment.status };
    if (!payment.mercadoPagoId) return { status: payment.status };

    const mpStatus = await this.mp.getPaymentStatus(payment.mercadoPagoId);

    if (mpStatus.status === 'approved') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID' },
      });
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.planGranted,
          creditsLeft: { increment: payment.creditsGranted },
        },
      });
      return { status: 'PAID' };
    }

    if (mpStatus.status === 'rejected' || mpStatus.status === 'cancelled') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      return { status: 'FAILED' };
    }

    return { status: 'PENDING' };
  }

  async handleWebhook(body: any) {
    if (body.type !== 'payment') return { ok: true };

    const mpId = body.data?.id?.toString();
    if (!mpId) return { ok: true };

    const payment = await this.prisma.payment.findFirst({
      where: { mercadoPagoId: mpId },
    });
    if (!payment || payment.status !== 'PENDING') return { ok: true };

    const mpStatus = await this.mp.getPaymentStatus(mpId);

    if (mpStatus.status === 'approved') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID' },
      });
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.planGranted,
          creditsLeft: { increment: payment.creditsGranted },
        },
      });
    }

    return { ok: true };
  }

  async getPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountCents: true,
        status: true,
        planGranted: true,
        creditsGranted: true,
        createdAt: true,
      },
    });
  }
}