import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXMark, heroLockClosed, heroSparkles } from '@ng-icons/heroicons/outline';

export type LockedFeature =
  | 'download'
  | 'coverLetter'
  | 'compare'
  | 'history'
  | 'englishVersion'
  | 'jobMatch'
  | 'rewritten';

interface FeatureInfo {
  title: string;
  description: string;
  requiredPlan: 'Básico' | 'Premium';
  benefits: string[];
}

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [provideIcons({ heroXMark, heroLockClosed, heroSparkles })],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
           (click)="close.emit()">
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
             (click)="$event.stopPropagation()">
          <button (click)="close.emit()"
                  class="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted transition">
            <ng-icon name="heroXMark" size="18"></ng-icon>
          </button>

          <div class="flex justify-center mb-4">
            <div class="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <ng-icon name="heroLockClosed" size="26" class="text-brand-primary"></ng-icon>
            </div>
          </div>

          <div class="text-center mb-6">
            <p class="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2">
              Disponível no {{ info().requiredPlan }}
            </p>
            <h2 class="text-2xl font-bold text-ink">{{ info().title }}</h2>
            <p class="mt-2 text-sm text-ink-muted">{{ info().description }}</p>
          </div>

          <div class="rounded-xl bg-surface-muted p-5 mb-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink mb-3 flex items-center gap-2">
              <ng-icon name="heroSparkles" size="14" class="text-brand-primary"></ng-icon>
              O que você desbloqueia
            </p>
            <ul class="space-y-2">
              @for (benefit of info().benefits; track benefit) {
                <li class="text-sm text-ink flex gap-2">
                  <span class="text-brand-primary font-bold">✓</span>
                  {{ benefit }}
                </li>
              }
            </ul>
          </div>

          <a routerLink="/billing"
             (click)="close.emit()"
             class="block w-full rounded-xl bg-brand-primary py-3 text-center font-semibold text-white hover:bg-brand-secondary transition">
            Ver planos
          </a>
          <button (click)="close.emit()"
                  class="mt-3 w-full text-sm text-ink-muted hover:text-ink transition">
            Agora não
          </button>
        </div>
      </div>
    }
  `,
})
export class UpgradeModalComponent {
  open = input.required<boolean>();
  feature = input.required<LockedFeature>();
  close = output<void>();

  private features: Record<LockedFeature, FeatureInfo> = {
    download: {
      title: 'Baixar seu currículo',
      description: 'Tenha o currículo otimizado pronto para enviar às vagas que quiser.',
      requiredPlan: 'Básico',
      benefits: [
        'Download em PDF profissional',
        'Download em DOCX editável',
        '5 análises completas',
        'Carta de apresentação incluída',
      ],
    },
    coverLetter: {
      title: 'Carta de apresentação com IA',
      description: 'Destaque-se com uma carta personalizada para cada vaga.',
      requiredPlan: 'Básico',
      benefits: [
        'Carta escrita pela IA baseada no seu currículo',
        'Tom profissional e impactante',
        'Pode gerar várias versões',
        'Inclui download em PDF e DOCX',
      ],
    },
    compare: {
      title: 'Comparação lado a lado',
      description: 'Veja exatamente o que mudou do original para a versão otimizada.',
      requiredPlan: 'Básico',
      benefits: [
        'Visualização antes/depois lado a lado',
        'Destaque de todas as mudanças',
        'Histórico de todas as versões',
      ],
    },
    history: {
      title: 'Histórico de análises',
      description: 'Acesse todas as suas análises anteriores a qualquer momento.',
      requiredPlan: 'Básico',
      benefits: [
        'Todas as versões salvas',
        'Acesso ilimitado ao histórico',
        'Reveja evoluções passadas',
      ],
    },
    englishVersion: {
      title: 'Versão em inglês',
      description: 'Currículo traduzido profissionalmente para vagas internacionais.',
      requiredPlan: 'Premium',
      benefits: [
        'Tradução profissional para inglês americano',
        'Mantém o tom e as conquistas',
        'Ideal para vagas internacionais',
        'Download em PDF e DOCX',
      ],
    },
    jobMatch: {
      title: 'Match com a vaga',
      description: 'Descubra o quanto seu currículo se alinha com a descrição da vaga.',
      requiredPlan: 'Premium',
      benefits: [
        'Score de compatibilidade de 0 a 100%',
        'Palavras-chave ausentes identificadas',
        'Sugestões para aumentar seu match',
      ],
    },
    rewritten: {
      title: 'Currículo reescrito pela IA',
      description: 'Veja a versão completa do seu currículo otimizado pela IA.',
      requiredPlan: 'Básico',
      benefits: [
        'Reescrita profissional completa',
        'Frases orientadas a resultados',
        'Download em PDF e DOCX',
        'Comparação com o original',
      ],
    },
  };

  info = computed(() => this.features[this.feature()]);
}