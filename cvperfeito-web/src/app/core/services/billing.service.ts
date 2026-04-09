import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type PlanKey = 'BASIC' | 'PREMIUM';

export interface PixResponse {
  paymentId: string;
  abacateId: string;
  amount: number;
  planName: string;
  plan: PlanKey;
  credits: number;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  checkout(plan: PlanKey) {
    return this.http.post<PixResponse>(
      `${this.api}/billing/checkout/${plan}`,
      {},
    );
  }

  simulate(paymentId: string) {
    return this.http.post(`${this.api}/billing/payments/${paymentId}/simulate`, {});
  }

  payments() {
    return this.http.get<any[]>(`${this.api}/billing/payments`);
  }

  check(paymentId: string) {
    return this.http.get<{ status: string }>(
      `${this.api}/billing/payments/${paymentId}/check`,
    );
  }
}