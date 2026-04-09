import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ResumeService } from '../../core/services/resume.service';
import { AuthService } from '../../core/services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCloudArrowUp,
  heroPaperClip,
  heroXMark,
} from '@ng-icons/heroicons/outline';

interface Step {
  label: string;
}

@Component({
  selector: 'app-upload-resume',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ heroCloudArrowUp, heroPaperClip, heroXMark }),
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
          Envie seu currículo e deixe nossas 5 IAs analisarem cada detalhe.
        </p>

        @if ((auth.user()?.creditsLeft ?? 0) === 0) {
          <div class="mt-6 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 px-6 py-4">
            <p class="text-sm text-ink">
              Você não tem créditos. <a routerLink="/billing" class="text-brand-primary font-semibold underline">Compre uma análise por R$ 5,00</a>.
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
          <label class="mb-2 block text-sm font-medium text-ink">
            Descrição da vaga (opcional)
          </label>
          <textarea
            [(ngModel)]="jobDescription"
            rows="6"
            placeholder="Cole aqui a descrição da vaga desejada para receber um match personalizado..."
            class="w-full rounded-xl border border-surface-border bg-white p-4 text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-hover/30">
          </textarea>
        </div>

        <div class="mt-6 rounded-xl border border-surface-border bg-white p-5">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="includeEnglish"
              class="mt-1 h-5 w-5 rounded border-surface-border text-brand-primary focus:ring-brand-primary">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-ink">Gerar versão em inglês</span>
                <span class="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
                  +R$ 5,00
                </span>
              </div>
              <p class="text-xs text-ink-muted mt-1">
                Tradução profissional do currículo otimizado para inglês americano. Ideal para vagas internacionais.
              </p>
            </div>
          </label>
        </div>

        @if (error()) {
          <div class="mt-4 rounded-xl bg-state-error/10 px-4 py-3 text-sm text-state-error">
            {{ error() }}
          </div>
        }

        <button
          (click)="submit()"
          [disabled]="!file() || loading()"
          class="mt-8 w-full rounded-xl bg-brand-primary py-4 font-semibold text-white shadow-lg hover:bg-brand-secondary transition disabled:opacity-50 disabled:cursor-not-allowed">
          Analisar currículo
        </button>
      </div>
    </section>
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
  includeEnglish = false;

  steps: Step[] = [
    { label: 'Extraindo texto do arquivo'},
    { label: 'Analisando compatibilidade ATS'},
    { label: 'Reescrevendo com IA profissional'},
    { label: 'Visão do recrutador sênior'},
    { label: 'Gerando sugestões e inovações'},
  ];

  private stepTimers: any[] = [];

  currentStepDisplay() {
  return Math.min(this.currentStep() + 1, this.steps.length);
}

  progressPct() {
    return Math.min(100, ((this.currentStep() + 1) / this.steps.length) * 100);
  }

 currentStepData() {
  return this.steps[this.currentStep()] || { label: 'Finalizando' };
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
        this.resumeService
          .analyze(res.id, this.jobDescription || undefined, this.includeEnglish)
          .subscribe({
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