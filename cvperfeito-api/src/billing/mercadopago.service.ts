import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
  }

  async createPixPayment(amount: number, description: string, email: string) {
    const payment = new Payment(this.client);

    const response = await payment.create({
      body: {
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        payer: { email },
      },
    });

    return {
      id: response.id,
      status: response.status,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code ?? null,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64
        ? `data:image/png;base64,${response.point_of_interaction.transaction_data.qr_code_base64}`
        : null,
    };
  }

  async getPaymentStatus(mercadoPagoId: string) {
    const payment = new Payment(this.client);
    const response = await payment.get({ id: mercadoPagoId });
    return {
      status: response.status,
      status_detail: response.status_detail,
    };
  }
}