import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  checkout() {
    return this.http.post<{ url: string; paymentId: string; amount: number }>(
      `${this.api}/billing/checkout`,
      {},
    );
  }

  pix() {
    return this.http.post<any>(`${this.api}/billing/pix`, {});
  }

  payments() {
    return this.http.get<any[]>(`${this.api}/billing/payments`);
  }

  check(paymentId: string) {
    return this.http.get<{ status: string }>(`${this.api}/billing/payments/${paymentId}/check`);
  }
}
