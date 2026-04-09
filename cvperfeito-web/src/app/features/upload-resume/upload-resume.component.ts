import { Component, inject, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCloudArrowUp,
  heroPaperClip,
  heroXMark,
  heroLockClosed,
  heroSparkles,
  heroCheck,
} from '@ng-icons/heroicons/outline';
import { ResumeService } from '../../core/services/resume.service';
import { AuthService } from '../../core/services/auth.service';
import { UpgradeModalComponent, LockedFeature } from '../../shared/ui/upgrade-model.component';

interface Step {
  label: string;
}

@Component({
  selector: 'app-upload-resume',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon, UpgradeModalComponent],
  viewProviders: [
    provideIcons({
      heroCloudArrowUp,
      heroPaperClip,
      heroXMark,
      heroLockClosed,
      heroSparkles,
      heroCheck,
    }),
  ],
  template: `
    @if (loading()) {
      <section class="fixed inset-0 bg-white z-50 flex items-center justify-center px-6">
        <div class="max-w-lg w-full">
          <div class="text-center mb-12">
            <div class="inline-flex h-16 w-16 rounded-2xl bg-brand-primary items-center justify-center text-white text-3xl font-bold">
              cv
            </div>
            <h2 class="mt-6 text-2xl font-bold text-ink">Analisando seu currículo</h2>
            <p class="mt-2 text-sm text-ink-muted">Não feche esta aba.</p>
          </div>

          <div class="min-h-[60px] flex items-center justify-center mb-6">
            <div class="flex items-center gap-3 animate-fade">
              <div class="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
              <span class="text-base font-medium text-ink">
                {{ currentStepData().label }}
              </span>
            </div>
          </div>

          <div class="h-2 bg-surface-muted rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-brand-primary to-brand-hover transition-all duration-1000 ease-out"
                 [style.width.%]="progressPct()"></div>
          </div>

          <p class="mt-4 text-center text-xs text-ink-muted">
            Etapa {{ currentStepDisplay() }} de {{ steps.length }}
          </p>
        </div>
      </section>
    }

    <section class="px-6 py-12">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-4xl font-bold text-ink">Otimize seu currículo</h1>
        <p class="mt-2 text-ink-muted">
          Envie seu currículo e deixe nossas IAs analisarem cada detalhe.
        </p>

        @if ((auth.user()?.creditsLeft ?? 0) === 0) {
          <div class="mt-6 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 px-6 py-4 flex items-center justify-between gap-4">
            <div class="flex-1">
              <p class="text-sm text-ink font-semibold">Você não tem créditos disponíveis</p>
              <p class="text-xs text-ink-muted mt-0.5">Escolha um plano para continuar analisando currículos.</p>
            </div>
            <a routerLink="/billing"
               class="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-secondary transition shrink-0">
              Ver planos
            </a>
          </div>
        } @else if (isPremium()) {
          <div class="mt-6 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 px-5 py-3 flex items-center gap-3">
            <ng-icon name="heroSparkles" size="18" class="text-brand-primary shrink-0"></ng-icon>
            <p class="text-sm text-ink">
              Como você é <strong>Premium</strong>, a versão em inglês do currículo será gerada automaticamente.
            </p>
          </div>
        }

        <div
          class="mt-10 rounded-2xl border-2 border-dashed border-surface-border bg-white p-12 text-center transition hover:border-brand-primary"
          [class.border-brand-primary]="dragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="dragging.set(false)"
          (drop)="onDrop($event)">
          <div class="flex justify-center mb-4">
            <ng-icon name="heroCloudArrowUp" size="56" class="text-ink-muted"></ng-icon>
          </div>
          <p class="text-lg font-medium text-ink">
            Arraste seu currículo aqui ou
            <label class="cursor-pointer text-brand-primary underline ml-1">
              escolha um arquivo
              <input type="file" class="hidden" (change)="onFile($event)" accept=".pdf,.docx" />
            </label>
          </p>
          <p class="mt-2 text-sm text-ink-muted">PDF ou DOCX, até 5MB</p>
        </div>

        @if (fileName()) {
          <div class="mt-4 rounded-xl bg-white border border-surface-border p-4 flex items-center justify-between">
            <span class="flex items-center gap-2 font-medium text-ink">
              <ng-icon name="heroPaperClip" size="16" class="text-ink-muted"></ng-icon>
              {{ fileName() }}
            </span>
            <button (click)="clear()" class="text-sm text-state-error hover:underline flex items-center gap-1">
              <ng-icon name="heroXMark" size="14"></ng-icon>
              Remover
            </button>
          </div>
        }

        <div class="mt-8">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-ink">
              Descrição da vaga (opcional)
            </label>
            @if (!canMatchJob()) {
              <button (click)="showUpgrade('jobMatch')"
                      class="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
                <ng-icon name="heroLockClosed" size="12"></ng-icon>
                Disponível no Premium
              </button>
            }
          </div>
          <textarea
            [(ngModel)]="jobDescription"
            (focus)="onJobTextareaFocus()"
            rows="6"
            [placeholder]="canMatchJob() ? 'Cole aqui a descrição da vaga desejada para receber um match personalizado...' : 'Match com descrição de vaga é exclusivo do plano Premium'"
            class="w-full rounded-xl border border-surface-border bg-white p-4 text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-hover/30"
            [class.opacity-60]="!canMatchJob()"
            [class.cursor-not-allowed]="!canMatchJob()"
            [readonly]="!canMatchJob()">
          </textarea>
          @if (!canMatchJob() && jobDescription) {
            <p class="mt-2 text-xs text-ink-muted">
              A descrição colada será ignorada. Faça upgrade para Premium para usar match de vaga.
            </p>
          }
        </div>

        @if (error()) {
          <div class="mt-4 rounded-xl bg-state-error/10 px-4 py-3 text-sm text-state-error">
            {{ error() }}
          </div>
        }

        <button
          (click)="submit()"
          [disabled]="!file() || loading() || (auth.user()?.creditsLeft ?? 0) === 0"
          class="mt-8 w-full rounded-xl bg-brand-primary py-4 font-semibold text-white shadow-lg hover:bg-brand-secondary transition disabled:opacity-50 disabled:cursor-not-allowed">
          Analisar currículo
        </button>
      </div>
    </section>

    <app-upgrade-modal
      [open]="upgradeModalOpen()"
      [feature]="upgradeFeature()"
      (close)="upgradeModalOpen.set(false)"
    />
  `,
})
export class UploadResumeComponent implements OnDestroy {
  private resumeService = inject(ResumeService);
  private router = inject(Router);
  auth = inject(AuthService);

  file = signal<File | null>(null);
  fileName = signal<string>('');
  loading = signal<boolean>(false);
  dragging = signal<boolean>(false);
  error = signal<string | null>(null);
  currentStep = signal<number>(0);
  jobDescription = '';

  upgradeModalOpen = signal(false);
  upgradeFeature = signal<LockedFeature>('jobMatch');

  isPremium = computed(() => this.auth.user()?.plan === 'PREMIUM');
  canMatchJob = computed(() => this.auth.user()?.plan === 'PREMIUM');

  steps: Step[] = [
    { label: 'Extraindo texto do arquivo' },
    { label: 'Analisando compatibilidade ATS' },
    { label: 'Reescrevendo com IA profissional' },
    { label: 'Visão do recrutador sênior' },
    { label: 'Gerando sugestões e inovações' },
  ];

  private stepTimers: any[] = [];

  currentStepData() {
    return this.steps[this.currentStep()] || { label: 'Finalizando' };
  }

  currentStepDisplay() {
    return Math.min(this.currentStep() + 1, this.steps.length);
  }

  progressPct() {
    return Math.min(100, ((this.currentStep() + 1) / this.steps.length) * 100);
  }

  showUpgrade(feature: LockedFeature) {
    this.upgradeFeature.set(feature);
    this.upgradeModalOpen.set(true);
  }

  onJobTextareaFocus() {
    if (!this.canMatchJob()) {
      this.showUpgrade('jobMatch');
    }
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.file.set(input.files[0]);
      this.fileName.set(input.files[0].name);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    const f = event.dataTransfer?.files[0];
    if (f) {
      this.file.set(f);
      this.fileName.set(f.name);
    }
  }

  clear() {
    this.file.set(null);
    this.fileName.set('');
  }

  private startStepProgression() {
    this.currentStep.set(0);
    const durations = [2000, 5000, 7000, 5000, 6000];
    let accumulated = 0;
    this.steps.forEach((_, i) => {
      if (i === 0) return;
      accumulated += durations[i - 1];
      const t = setTimeout(() => this.currentStep.set(i), accumulated);
      this.stepTimers.push(t);
    });
  }

  private clearStepTimers() {
    this.stepTimers.forEach(clearTimeout);
    this.stepTimers = [];
  }

  submit() {
    if (!this.file()) return;
    this.error.set(null);
    this.loading.set(true);
    this.startStepProgression();

    this.resumeService.upload(this.file()!).subscribe({
      next: (res) => {
        const jobToSend = this.canMatchJob() ? this.jobDescription || undefined : undefined;
        this.resumeService.analyze(res.id, jobToSend).subscribe({
          next: () => {
            this.clearStepTimers();
            this.currentStep.set(this.steps.length);
            this.auth.fetchMe().subscribe();
            setTimeout(() => {
              this.loading.set(false);
              this.router.navigate(['/analysis', res.id]);
            }, 500);
          },
          error: (err) => {
            this.clearStepTimers();
            this.loading.set(false);
            this.error.set(err?.error?.message || 'Erro ao analisar');
          },
        });
      },
      error: (err) => {
        this.clearStepTimers();
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Erro no upload');
      },
    });
  }

  ngOnDestroy() {
    this.clearStepTimers();
  }
}