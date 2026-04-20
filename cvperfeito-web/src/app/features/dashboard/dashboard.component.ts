import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ResumeService } from '../../core/services/resume.service';
import { AuthService } from '../../core/services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroDocumentText, heroPlus, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [provideIcons({ heroDocumentText, heroPlus, heroXMark })],
  template: `
    @if (loading()) {
      <section class="fixed inset-0 z-50 flex items-center justify-center bg-surface-muted/95 px-6 backdrop-blur-sm">
        <div class="w-full max-w-4xl">
          <div class="rounded-3xl border border-surface-border bg-white p-8 shadow-xl">
            <div class="mb-8 text-center">
              <div class="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-3xl font-bold text-white">
                cv
              </div>
              <h1 class="mt-6 text-3xl font-bold text-ink">Carregando sua dashboard</h1>
              <p class="mt-2 text-sm text-ink-muted">
                Se o app ficou um tempo sem uso, o servidor pode levar alguns segundos para acordar.
              </p>
            </div>

            <div class="mb-8 flex items-center justify-center gap-3">
              <div class="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
              <span class="text-sm font-medium text-ink">Buscando seus dados e currículos...</span>
            </div>

            <div class="grid gap-4 md:grid-cols-4">
              @for (card of [1, 2, 3, 4]; track card) {
                <div class="rounded-2xl border border-surface-border bg-surface-muted/40 p-5">
                  <div class="loading-shimmer h-4 w-28 rounded-full"></div>
                  <div class="loading-shimmer mt-4 h-8 w-16 rounded-full"></div>
                </div>
              }
            </div>

            <div class="mt-6 rounded-2xl border border-surface-border p-6">
              <div class="mb-4 flex items-center justify-between">
                <div class="loading-shimmer h-5 w-48 rounded-full"></div>
                <div class="loading-shimmer h-4 w-24 rounded-full"></div>
              </div>

              <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                @for (item of [1, 2, 3]; track item) {
                  <div class="rounded-2xl border border-surface-border bg-white p-6">
                    <div class="loading-shimmer h-5 w-2/3 rounded-full"></div>
                    <div class="loading-shimmer mt-3 h-4 w-1/3 rounded-full"></div>
                    <div class="loading-shimmer mt-6 h-9 w-full rounded-xl"></div>
                    <div class="mt-3 flex gap-2">
                      <div class="loading-shimmer h-8 flex-1 rounded-lg"></div>
                      <div class="loading-shimmer h-8 flex-1 rounded-lg"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>
    }

    <section class="px-6 py-12">
      <div class="mx-auto max-w-7xl">
        <div class="mb-10 flex items-end justify-between">
          <div>
            <h1 class="text-4xl font-bold text-ink">Olá, {{ auth.user()?.name || 'visitante' }}</h1>
            <p class="mt-2 text-ink-muted">Veja todos os seus currículos analisados.</p>
          </div>

          <a
            routerLink="/upload"
            class="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white shadow transition hover:bg-brand-secondary">
            <ng-icon name="heroPlus" size="18"></ng-icon>
            Novo currículo
          </a>
        </div>

        <div class="mb-10 grid gap-4 md:grid-cols-4">
          <div class="rounded-2xl border border-surface-border bg-white p-6">
            <p class="text-sm text-ink-muted">Créditos disponíveis</p>
            <p class="mt-2 text-3xl font-bold text-brand-primary">{{ auth.user()?.creditsLeft ?? 0 }}</p>
          </div>

          <div class="rounded-2xl border border-surface-border bg-white p-6">
            <p class="text-sm text-ink-muted">Currículos enviados</p>
            <p class="mt-2 text-3xl font-bold text-ink">{{ resumes().length }}</p>
          </div>

          <div class="rounded-2xl border border-surface-border bg-white p-6">
            <p class="text-sm text-ink-muted">Análises feitas</p>
            <p class="mt-2 text-3xl font-bold text-ink">{{ analyzedCount() }}</p>
          </div>

          <div class="rounded-2xl border border-surface-border bg-white p-6">
            <p class="text-sm text-ink-muted">Score ATS médio</p>
            <p class="mt-2 text-3xl font-bold text-ink">{{ avgScore() }}/100</p>
          </div>
        </div>

        @if (!loading() && scoreHistory().length >= 2) {
          <div class="mb-10 rounded-2xl border border-surface-border bg-white p-8">
            <div class="mb-6 flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-ink">Evolução do seu ATS Score</h3>
                <p class="mt-1 text-xs text-ink-muted">Últimas {{ scoreHistory().length }} análises</p>
              </div>

              <div class="text-right">
                <p class="text-xs text-ink-muted">Último score</p>
                <p class="text-2xl font-bold text-brand-primary">{{ lastScore() }}/100</p>
                @if (scoreDelta() !== 0) {
                  <p class="text-xs font-semibold"
                     [class.text-state-success]="scoreDelta() > 0"
                     [class.text-state-error]="scoreDelta() < 0">
                    {{ scoreDelta() > 0 ? '↑' : '↓' }} {{ absDelta() }} pts
                  </p>
                }
              </div>
            </div>

            <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" class="h-48 w-full">
              <line [attr.x1]="padding" [attr.y1]="padding" [attr.x2]="padding" [attr.y2]="chartHeight - padding"
                    stroke="#E5E7EB" stroke-width="1" />
              <line [attr.x1]="padding" [attr.y1]="chartHeight - padding"
                    [attr.x2]="chartWidth - padding" [attr.y2]="chartHeight - padding"
                    stroke="#E5E7EB" stroke-width="1" />

              @for (g of gridLines(); track g.value) {
                <line [attr.x1]="padding" [attr.y1]="g.y" [attr.x2]="chartWidth - padding" [attr.y2]="g.y"
                      stroke="#F3F4F6" stroke-width="1" stroke-dasharray="2,2" />
                <text [attr.x]="padding - 8" [attr.y]="g.y + 4" text-anchor="end"
                      font-size="10" fill="#9CA3AF">{{ g.value }}</text>
              }

              <polyline [attr.points]="linePoints()" fill="none" stroke="#C1121F" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round" />

              <polyline [attr.points]="areaPoints()" fill="url(#gradient)" opacity="0.15" />

              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#C1121F" />
                  <stop offset="100%" stop-color="#C1121F" stop-opacity="0" />
                </linearGradient>
              </defs>

              @for (p of chartPoints(); track p.x) {
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="white"
                        stroke="#C1121F" stroke-width="2.5" />
                <text [attr.x]="p.x" [attr.y]="p.y - 12" text-anchor="middle"
                      font-size="11" font-weight="600" fill="#C1121F">{{ p.score }}</text>
              }
            </svg>
          </div>
        }

        @if (!loading() && resumes().length === 0) {
          <div class="rounded-2xl border-2 border-dashed border-surface-border bg-white p-16 text-center">
            <div class="mb-4 flex justify-center">
              <ng-icon name="heroDocumentText" size="64" class="text-ink-muted"></ng-icon>
            </div>
            <h3 class="text-xl font-semibold text-ink">Nenhum currículo ainda</h3>
            <p class="mt-2 text-ink-muted">Faça upload do seu primeiro currículo para começar.</p>
            <a
              routerLink="/upload"
              class="mt-6 inline-block rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white transition hover:bg-brand-secondary">
              Enviar currículo
            </a>
          </div>
        } @else if (!loading()) {
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            @for (resume of resumes(); track resume.id) {
              <div class="group relative rounded-2xl border border-surface-border bg-white p-6 transition hover:shadow-md">
                <button
                  (click)="remove(resume.id, $event)"
                  [disabled]="deleting() === resume.id"
                  class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-ink-muted opacity-0 transition hover:bg-state-error hover:text-white disabled:opacity-50 group-hover:opacity-100"
                  title="Excluir currículo">
                  <ng-icon name="heroXMark" size="14"></ng-icon>
                </button>

                <div class="mb-4 flex items-start justify-between pr-8">
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate font-semibold text-ink">{{ resume.title }}</h3>
                    <p class="mt-1 text-xs text-ink-muted">
                      {{ resume.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </p>
                  </div>

                  @if (resume.analyses?.[0]?.atsScore !== undefined) {
                    <div class="ml-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
                      {{ resume.analyses[0].atsScore }}/100
                    </div>
                  }
                </div>

                <div class="mb-4 text-xs">
                  <span class="rounded-full px-2 py-1"
                        [class.bg-state-success]="resume.status === 'ANALYZED'"
                        [class.text-white]="resume.status === 'ANALYZED'"
                        [class.bg-surface-muted]="resume.status !== 'ANALYZED'"
                        [class.text-ink-muted]="resume.status !== 'ANALYZED'">
                    {{ statusLabel(resume.status) }}
                  </span>
                </div>

                <div class="flex gap-2">
                  <a
                    [routerLink]="['/analysis', resume.id]"
                    class="flex-1 rounded-lg bg-brand-primary px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-brand-secondary">
                    Ver análise
                  </a>
                  <a
                    [routerLink]="['/compare', resume.id]"
                    class="flex-1 rounded-lg border border-surface-border px-3 py-2 text-center text-xs font-semibold text-ink transition hover:border-brand-primary">
                    Comparar
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private resumeService = inject(ResumeService);

  resumes = signal<any[]>([]);
  loading = signal(true);
  deleting = signal<string | null>(null);

  readonly chartWidth = 800;
  readonly chartHeight = 220;
  readonly padding = 40;

  ngOnInit() {
    forkJoin({
      user: this.auth.fetchMe().pipe(catchError(() => of(null))),
      resumes: this.resumeService.list().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ resumes }) => {
        this.resumes.set(resumes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  scoreHistory() {
    return this.resumes()
      .filter((r) => r.analyses?.[0]?.atsScore !== undefined)
      .map((r) => ({
        score: r.analyses[0].atsScore,
        date: new Date(r.createdAt),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-10);
  }

  lastScore() {
    const history = this.scoreHistory();
    return history.length ? history[history.length - 1].score : 0;
  }

  scoreDelta() {
    const history = this.scoreHistory();
    if (history.length < 2) return 0;
    return history[history.length - 1].score - history[history.length - 2].score;
  }

  absDelta() {
    return Math.abs(this.scoreDelta());
  }

  chartPoints() {
    const history = this.scoreHistory();
    if (history.length === 0) return [];

    const innerW = this.chartWidth - this.padding * 2;
    const innerH = this.chartHeight - this.padding * 2;
    const stepX = history.length > 1 ? innerW / (history.length - 1) : 0;

    return history.map((item, index) => ({
      x: this.padding + stepX * index,
      y: this.padding + innerH - (item.score / 100) * innerH,
      score: item.score,
    }));
  }

  linePoints() {
    return this.chartPoints().map((point) => `${point.x},${point.y}`).join(' ');
  }

  areaPoints() {
    const points = this.chartPoints();
    if (points.length === 0) return '';

    const bottom = this.chartHeight - this.padding;
    const first = points[0];
    const last = points[points.length - 1];

    return `${first.x},${bottom} ${points.map((point) => `${point.x},${point.y}`).join(' ')} ${last.x},${bottom}`;
  }

  gridLines() {
    const innerH = this.chartHeight - this.padding * 2;
    return [0, 25, 50, 75, 100].map((value) => ({
      value,
      y: this.padding + innerH - (value / 100) * innerH,
    }));
  }

  remove(id: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm('Tem certeza que deseja excluir este currículo? Essa ação não pode ser desfeita.')) {
      return;
    }

    this.deleting.set(id);
    this.resumeService.remove(id).subscribe({
      next: () => {
        this.resumes.set(this.resumes().filter((resume) => resume.id !== id));
        this.deleting.set(null);
      },
      error: () => this.deleting.set(null),
    });
  }

  avgScore() {
    const scores = this.resumes()
      .map((resume) => resume.analyses?.[0]?.atsScore)
      .filter((score) => typeof score === 'number');

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
  }

  analyzedCount() {
    return this.resumes().filter((resume) => resume.analyses?.[0]?.atsScore !== undefined).length;
  }

  statusLabel(status: string) {
    const map: Record<string, string> = {
      UPLOADED: 'Pronto para analisar',
      PROCESSING: 'Processando',
      ANALYZED: 'Analisado',
      FAILED: 'Falhou',
    };

    return map[status] || status;
  }
}
