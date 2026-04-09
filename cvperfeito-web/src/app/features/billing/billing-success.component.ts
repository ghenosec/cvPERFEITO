import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-billing-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="min-h-[80vh] flex items-center justify-center px-6">
      <div class="text-center max-w-md">
        <div class="inline-flex h-20 w-20 rounded-full bg-state-success items-center justify-center text-white text-4xl">✓</div>
        <h1 class="mt-6 text-3xl font-bold text-ink">Pagamento confirmado!</h1>
        <p class="mt-2 text-ink-muted">
          Você ganhou <span class="text-brand-primary font-semibold">1 crédito</span> de análise. Saldo atual: {{ auth.user()?.creditsLeft ?? 0 }}.
        </p>
        <div class="mt-8 flex gap-3 justify-center">
          <a routerLink="/upload" class="rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-secondary transition">
            Analisar currículo agora
          </a>
          <a routerLink="/dashboard" class="rounded-xl border border-surface-border px-6 py-3 font-semibold text-ink hover:border-brand-primary transition">
            Ir para o dashboard
          </a>
        </div>
      </div>
    </section>
  `,
})
export class BillingSuccessComponent implements OnInit {
  auth = inject(AuthService);

  ngOnInit() {
    this.auth.fetchMe().subscribe();
  }
}
