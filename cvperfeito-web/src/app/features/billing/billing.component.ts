import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BillingService } from '../../core/services/billing.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="px-6 py-16">
      <div class="mx-auto max-w-3xl">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-ink">Compre uma análise</h1>
          <p class="mt-2 text-ink-muted">Pague apenas pelo que usar. Sem mensalidades.</p>
        </div>

        <div class="rounded-2xl border-2 border-brand-primary bg-white p-8 shadow-xl mb-8">
          <div class="text-center">
            <div class="inline-block rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-white">
              PAY-PER-USE
            </div>
            <h2 class="mt-4 text-2xl font-bold text-ink">1 Análise Completa</h2>
            <p class="mt-1 text-5xl font-bold text-brand-primary">R$ 5<span class="text-lg text-ink-muted">,00</span></p>
            <p class="mt-2 text-sm text-ink-muted">Pagamento via PIX</p>
          </div>

          <ul class="mt-8 space-y-3 text-sm text-ink">
            <li class="flex gap-3">✓ Análise ATS completa (score 0-100)</li>
            <li class="flex gap-3">✓ Reescrita profissional do currículo</li>
            <li class="flex gap-3">✓ Visão do recrutador (pontos fortes/fracos)</li>
            <li class="flex gap-3">✓ Match com descrição de vaga</li>
            <li class="flex gap-3">✓ Sugestões de inovação e LinkedIn</li>
            <li class="flex gap-3">✓ Carta de apresentação personalizada</li>
            <li class="flex gap-3">✓ Histórico e versionamento</li>
            <li class="flex gap-3">✓ Comparação lado a lado (antes/depois)</li>
          </ul>

          @if (!pixData()) {
            <button (click)="buy()"
                    [disabled]="loading()"
                    class="mt-8 w-full rounded-xl bg-brand-primary py-4 font-semibold text-white shadow hover:bg-brand-secondary transition disabled:opacity-50">
              {{ loading() ? 'Gerando PIX...' : 'Pagar R$ 5,00 com PIX' }}
            </button>
          }
        </div>

        @if (error()) {
          <div class="rounded-xl bg-state-error/10 px-4 py-3 text-sm text-state-error mb-6">
            {{ error() }}
          </div>
        }

        @if (pixData(); as pix) {
          <div class="rounded-2xl bg-white border border-surface-border p-8">
            <h3 class="text-xl font-semibold text-ink mb-4 text-center">Escaneie o QR Code para pagar</h3>

            @if (pix.qrCodeBase64) {
              <div class="flex justify-center mb-6">
                <img [src]="pix.qrCodeBase64" alt="QR Code PIX" class="w-64 h-64 rounded-xl border border-surface-border" />
              </div>
            }

            <div class="space-y-3">
              <p class="text-sm font-semibold text-ink">Ou use o código copia-e-cola:</p>
              <div class="rounded-xl bg-surface-muted p-4 break-all text-xs text-ink-muted font-mono">
                {{ pix.copyPaste }}
              </div>
              <button (click)="copy(pix.copyPaste)"
                      class="w-full rounded-xl border border-brand-primary text-brand-primary py-3 font-semibold hover:bg-brand-primary hover:text-white transition">
                {{ copied() ? '✓ Copiado!' : 'Copiar código' }}
              </button>
            </div>

            <div class="mt-6 rounded-xl bg-brand-primary/5 px-4 py-3 text-center text-sm text-ink-muted">
              Aguardando pagamento... <span class="text-brand-primary font-semibold">verificando a cada 5s</span>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class BillingComponent implements OnDestroy {
  private billing = inject(BillingService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  pixData = signal<any>(null);
  copied = signal(false);
  private pollHandle: any = null;

  buy() {
    this.error.set(null);
    this.loading.set(true);
    this.billing.pix().subscribe({
      next: (data) => {
        this.pixData.set(data);
        this.loading.set(false);
        this.startPolling(data.paymentId);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Erro ao gerar PIX');
      },
    });
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  private startPolling(paymentId: string) {
    this.pollHandle = setInterval(() => {
      this.billing.check(paymentId).subscribe((res) => {
        if (res.status === 'PAID') {
          clearInterval(this.pollHandle);
          this.auth.fetchMe().subscribe();
          this.router.navigate(['/billing/success']);
        }
      });
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }
}
