import { Component, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCheck,
  heroXMark,
  heroSparkles,
  heroArrowLeft,
} from '@ng-icons/heroicons/outline';
import { BillingService, PlanKey, PixResponse } from '../../core/services/billing.service';
import { AuthService } from '../../core/services/auth.service';

interface PlanCard {
  key: 'FREE' | PlanKey;
  name: string;
  price: string;
  priceSuffix?: string;
  description: string;
  highlight: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [
    provideIcons({ heroCheck, heroXMark, heroSparkles, heroArrowLeft }),
  ],
  template: `
    <section class="px-6 py-16">
      <div class="mx-auto max-w-6xl">
        <button (click)="back()" class="text-sm text-ink-muted hover:text-brand-primary flex items-center gap-1 mb-6">
          <ng-icon name="heroArrowLeft" size="14"></ng-icon>
          Voltar
        </button>

        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-ink">Escolha seu plano</h1>
          <p class="mt-3 text-ink-muted max-w-xl mx-auto">
            Pague apenas pelo que usar. Sem mensalidades, sem surpresas. Compra única via PIX.
          </p>
          @if (auth.user()) {
            <p class="mt-4 text-sm">
              <span class="text-ink-muted">Plano atual:</span>
              <span class="font-semibold text-brand-primary ml-1">{{ currentPlanLabel() }}</span>
              <span class="text-ink-muted mx-2">•</span>
              <span class="text-ink-muted">{{ auth.user()?.creditsLeft ?? 0 }} créditos restantes</span>
            </p>
          }
        </div>

        @if (!pixData()) {
          <div class="grid gap-6 lg:grid-cols-3">
            @for (plan of plans(); track plan.key) {
              <div class="rounded-2xl bg-white border p-8 flex flex-col relative transition"
                   [class.border-surface-border]="!plan.highlight"
                   [class.border-brand-primary]="plan.highlight"
                   [class.border-2]="plan.highlight"
                   [class.shadow-xl]="plan.highlight">

                @if (plan.highlight) {
                  <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span class="rounded-full bg-brand-primary px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                      <ng-icon name="heroSparkles" size="12"></ng-icon>
                      Recomendado
                    </span>
                  </div>
                }

                @if (isCurrentPlan(plan.key)) {
                  <div class="absolute top-4 right-4">
                    <span class="rounded-full bg-state-success/10 px-2.5 py-1 text-[10px] font-bold text-state-success uppercase tracking-wider">
                      Atual
                    </span>
                  </div>
                }

                <div>
                  <h3 class="text-lg font-semibold text-ink">{{ plan.name }}</h3>
                  <p class="mt-1 text-sm text-ink-muted">{{ plan.description }}</p>
                  <div class="mt-5 flex items-baseline gap-1">
                    <span class="text-4xl font-bold text-ink">{{ plan.price }}</span>
                    @if (plan.priceSuffix) {
                      <span class="text-sm text-ink-muted">{{ plan.priceSuffix }}</span>
                    }
                  </div>
                </div>

                <ul class="mt-8 space-y-3 flex-1">
                  @for (feature of plan.features; track feature.text) {
                    <li class="flex gap-3 text-sm">
                      @if (feature.included) {
                        <ng-icon name="heroCheck" size="18" class="text-state-success shrink-0 mt-0.5"></ng-icon>
                        <span class="text-ink">{{ feature.text }}</span>
                      } @else {
                        <ng-icon name="heroXMark" size="18" class="text-ink-muted shrink-0 mt-0.5"></ng-icon>
                        <span class="text-ink-muted line-through">{{ feature.text }}</span>
                      }
                    </li>
                  }
                </ul>

                <div class="mt-8">
                  @if (plan.key === 'FREE') {
                    <button disabled
                            class="w-full rounded-xl bg-surface-muted py-3 font-semibold text-ink-muted cursor-not-allowed">
                      {{ plan.cta }}
                    </button>
                  } @else if (isDowngradeFrom(plan.key)) {
                    <button disabled
                            class="w-full rounded-xl bg-surface-muted py-3 font-semibold text-ink-muted cursor-not-allowed"
                            title="Você já tem um plano superior">
                      Plano inferior
                    </button>
                  } @else {
                    <button (click)="buy(plan.key)"
                            [disabled]="loading()"
                            class="w-full rounded-xl py-3 font-semibold shadow transition disabled:opacity-50"
                            [class.bg-brand-primary]="plan.highlight"
                            [class.text-white]="plan.highlight"
                            [class.hover:bg-brand-secondary]="plan.highlight"
                            [class.border]="!plan.highlight"
                            [class.border-brand-primary]="!plan.highlight"
                            [class.text-brand-primary]="!plan.highlight"
                            [class.hover:bg-brand-primary]="!plan.highlight"
                            [class.hover:text-white]="!plan.highlight">
                      {{ loading() && selectedPlan() === plan.key ? 'Gerando PIX...' : plan.cta }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          @if (creditsWarning()) {
            <div class="mt-8 rounded-xl bg-brand-primary/5 border border-brand-primary/20 px-5 py-4 text-sm text-ink max-w-xl mx-auto">
              <strong class="text-brand-primary">Atenção:</strong>
              você ainda tem {{ auth.user()?.creditsLeft }} créditos no seu plano atual.
              Ao comprar um novo plano, esses créditos serão substituídos pelos créditos do novo plano.
            </div>
          }
        }

        @if (error()) {
          <div class="mt-8 max-w-md mx-auto rounded-xl bg-state-error/10 px-4 py-3 text-sm text-state-error">
            {{ error() }}
          </div>
        }

        @if (pixData(); as pix) {
          <div class="max-w-lg mx-auto">
            <div class="rounded-2xl bg-white border border-surface-border p-8">
              <div class="text-center mb-6">
                <p class="text-xs font-bold uppercase tracking-wider text-brand-primary">Plano {{ pix.planName }}</p>
                <h2 class="mt-2 text-3xl font-bold text-ink">R$ {{ (pix.amount / 100).toFixed(2).replace('.', ',') }}</h2>
                <p class="mt-1 text-sm text-ink-muted">{{ pix.credits }} análises completas</p>
              </div>

              <h3 class="text-sm font-semibold text-ink mb-4 text-center">Escaneie o QR Code para pagar</h3>

              @if (pix.qrCodeBase64) {
                <div class="flex justify-center mb-6">
                  <img [src]="pix.qrCodeBase64" alt="QR Code PIX" class="w-56 h-56 rounded-xl border border-surface-border" />
                </div>
              }

              <div class="space-y-3">
                <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Ou use o código copia-e-cola:</p>
                <div class="rounded-xl bg-surface-muted p-3 break-all text-[10px] text-ink-muted font-mono">
                  {{ pix.copyPaste }}
                </div>
                <button (click)="copy(pix.copyPaste)"
                        class="w-full rounded-xl border border-brand-primary text-brand-primary py-2.5 text-sm font-semibold hover:bg-brand-primary hover:text-white transition">
                  {{ copied() ? 'Copiado!' : 'Copiar código' }}
                </button>
              </div>

              <div class="mt-5 rounded-xl bg-brand-primary/5 px-4 py-3 text-center text-xs text-ink-muted">
                Aguardando pagamento... verificando a cada 5s
              </div>

              <div class="mt-4 rounded-xl bg-state-success/5 border border-dashed border-state-success/40 p-4">
                <p class="text-[10px] text-ink-muted mb-3 text-center uppercase tracking-wider font-semibold">
                  Modo de desenvolvimento
                </p>
                <button (click)="simulate(pix.paymentId)"
                        [disabled]="simulating()"
                        class="w-full rounded-xl border-2 border-dashed border-state-success text-state-success py-2.5 text-sm font-semibold hover:bg-state-success hover:text-white transition disabled:opacity-50">
                  {{ simulating() ? 'Simulando...' : 'Simular pagamento (dev)' }}
                </button>
              </div>
            </div>

            <button (click)="cancel()" class="mt-4 w-full text-sm text-ink-muted hover:text-ink transition">
              Cancelar e voltar aos planos
            </button>
          </div>
        }
      </div>
    </section>
  `,
})
export class BillingComponent implements OnDestroy {
  private billing = inject(BillingService);
  auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  simulating = signal(false);
  error = signal<string | null>(null);
  pixData = signal<PixResponse | null>(null);
  copied = signal(false);
  selectedPlan = signal<PlanKey | null>(null);
  private pollHandle: any = null;

  currentPlanLabel = computed(() => {
    const plan = this.auth.user()?.plan;
    if (plan === 'PREMIUM') return 'Premium';
    if (plan === 'BASIC') return 'Básico';
    return 'Gratuito';
  });

  creditsWarning = computed(() => {
    const user = this.auth.user();
    if (!user) return false;
    return user.plan !== 'FREE' && (user.creditsLeft ?? 0) > 0;
  });

  plans = computed<PlanCard[]>(() => [
    {
      key: 'FREE',
      name: 'Gratuito',
      price: 'R$ 0',
      description: 'Experimente as funcionalidades essenciais.',
      highlight: false,
      cta: 'Plano atual',
      features: [
        { text: '1 análise ATS', included: true },
        { text: 'Score ATS de 0-100', included: true },
        { text: 'Lista de problemas encontrados', included: true },
        { text: 'Visão do recrutador', included: true },
        { text: 'Currículo reescrito pela IA', included: false },
        { text: 'Download em PDF e DOCX', included: false },
        { text: 'Carta de apresentação', included: false },
        { text: 'Match com descrição de vaga', included: false },
        { text: 'Versão em inglês', included: false },
      ],
    },
    {
      key: 'BASIC',
      name: 'Básico',
      price: 'R$ 4,90',
      description: 'Pronto para se candidatar.',
      highlight: true,
      cta: 'Comprar Básico',
      features: [
        { text: '5 análises completas', included: true },
        { text: 'Tudo do plano Gratuito', included: true },
        { text: 'Currículo reescrito pela IA', included: true },
        { text: 'Download em PDF e DOCX', included: true },
        { text: 'Carta de apresentação', included: true },
        { text: 'Histórico de análises', included: true },
        { text: 'Comparação antes/depois', included: true },
        { text: 'Match com descrição de vaga', included: false },
        { text: 'Versão em inglês', included: false },
      ],
    },
    {
      key: 'PREMIUM',
      name: 'Premium',
      price: 'R$ 9,90',
      description: 'Para candidatos que querem se destacar.',
      highlight: false,
      cta: 'Comprar Premium',
      features: [
        { text: '15 análises completas', included: true },
        { text: 'Tudo do plano Básico', included: true },
        { text: 'Match com descrição de vaga', included: true },
        { text: 'Versão em inglês automática', included: true },
        { text: 'Gráfico de evolução do ATS', included: true },
        { text: 'Sugestões avançadas de inovação', included: true },
        { text: 'Suporte prioritário', included: true },
      ],
    },
  ]);

  isCurrentPlan(key: string): boolean {
    return this.auth.user()?.plan === key;
  }

  isDowngradeFrom(target: PlanKey): boolean {
    const current = this.auth.user()?.plan;
    if (current === 'PREMIUM' && target === 'BASIC') return true;
    return false;
  }

  back() {
    this.router.navigate(['/dashboard']);
  }

  buy(plan: PlanKey) {
    this.error.set(null);
    this.loading.set(true);
    this.selectedPlan.set(plan);
    this.billing.checkout(plan).subscribe({
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

  cancel() {
    if (this.pollHandle) clearInterval(this.pollHandle);
    this.pixData.set(null);
    this.selectedPlan.set(null);
  }

  copy(text: string) {
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  simulate(paymentId: string) {
    this.error.set(null);
    this.simulating.set(true);
    this.billing.simulate(paymentId).subscribe({
      next: () => {
        if (this.pollHandle) clearInterval(this.pollHandle);
        this.auth.fetchMe().subscribe();
        this.simulating.set(false);
        this.router.navigate(['/billing/success']);
      },
      error: (err) => {
        this.simulating.set(false);
        this.error.set(err?.error?.message || 'Erro ao simular pagamento');
      },
    });
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