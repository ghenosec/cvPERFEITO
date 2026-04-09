import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft,
  heroEllipsisHorizontal,
  heroArrowDownTray,
  heroEnvelope,
  heroChevronDown,
  heroChartBar,
  heroClock,
  heroLink,
  heroCheck,
  heroEye,
  heroBolt,
  heroDocumentText,
  heroLightBulb,
  heroAcademicCap,
} from '@ng-icons/heroicons/outline';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({
      heroArrowLeft,
      heroEllipsisHorizontal,
      heroArrowDownTray,
      heroEnvelope,
      heroChevronDown,
      heroChartBar,
      heroClock,
      heroLink,
      heroCheck,
      heroEye,
      heroBolt,
      heroDocumentText,
      heroLightBulb,
      heroAcademicCap,
    }),
  ],
  template: `
    <section class="px-6 py-12">
      <div class="mx-auto max-w-6xl">
        @if (loading()) {
          <p class="text-ink-muted">Carregando análise...</p>
        } @else {
          @if (data(); as d) {
            <div class="flex items-center justify-between mb-8">
              <div>
                <a routerLink="/dashboard" class="text-sm text-ink-muted hover:text-brand-primary flex items-center gap-1 w-fit">
                  <ng-icon name="heroArrowLeft" size="14"></ng-icon>
                  Voltar
                </a>
                <h1 class="text-3xl font-bold text-ink mt-2">{{ d.title }}</h1>
              </div>

              <div class="flex gap-2 flex-wrap items-center relative">
                <button
                  (click)="toggleMoreMenu($event)"
                  class="rounded-xl border border-surface-border px-4 py-2 text-sm font-semibold text-ink hover:border-brand-primary transition flex items-center gap-2">
                  <ng-icon name="heroEllipsisHorizontal" size="18"></ng-icon>
                  Mais
                </button>

                @if (moreMenuOpen()) {
                  <div class="absolute top-12 left-0 z-20 w-56 rounded-xl bg-white border border-surface-border shadow-lg py-2"
                       (click)="$event.stopPropagation()">
                    <a [routerLink]="['/compare', d.id]"
                       class="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-surface-muted transition">
                      <ng-icon name="heroChartBar" size="16" class="text-ink-muted"></ng-icon>
                      Comparar versões
                    </a>
                    <a [routerLink]="['/history', d.id]"
                       class="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-surface-muted transition">
                      <ng-icon name="heroClock" size="16" class="text-ink-muted"></ng-icon>
                      Histórico
                    </a>
                    <button (click)="toggleShare(); moreMenuOpen.set(false)"
                            class="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-surface-muted transition">
                      @if (shareToken()) {
                        <ng-icon name="heroCheck" size="16" class="text-state-success"></ng-icon>
                        Link copiado
                      } @else {
                        <ng-icon name="heroLink" size="16" class="text-ink-muted"></ng-icon>
                        Compartilhar
                      }
                    </button>
                  </div>
                }

                <button
                  (click)="generateCoverLetter()"
                  [disabled]="generatingCover()"
                  class="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-secondary transition disabled:opacity-50 flex items-center gap-2">
                  <ng-icon name="heroEnvelope" size="16"></ng-icon>
                  {{ generatingCover() ? 'Gerando...' : 'Carta de apresentação' }}
                </button>

                <div class="relative">
                  <button
                    (click)="toggleDownloadMenu($event)"
                    [disabled]="downloading()"
                    class="rounded-xl bg-state-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                    <ng-icon name="heroArrowDownTray" size="16"></ng-icon>
                    {{ downloading() ? 'Gerando...' : 'Baixar' }}
                    <ng-icon name="heroChevronDown" size="14"></ng-icon>
                  </button>

                  @if (downloadMenuOpen()) {
                    <div class="absolute top-12 right-0 z-20 w-64 rounded-xl bg-white border border-surface-border shadow-lg py-2"
                         (click)="$event.stopPropagation()">
                      <div class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Português
                      </div>
                      <button (click)="pickDownload('pdf', 'pt')"
                              class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-surface-muted transition">
                        <span>PDF</span>
                        <span class="text-xs text-ink-muted">recomendado</span>
                      </button>
                      <button (click)="pickDownload('docx', 'pt')"
                              class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-surface-muted transition">
                        <span>DOCX</span>
                        <span class="text-xs text-ink-muted">editável</span>
                      </button>

                      @if (hasEnglishVersion()) {
                        <div class="border-t border-surface-border mt-1 pt-1">
                          <div class="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                            English
                          </div>
                          <button (click)="pickDownload('pdf', 'en')"
                                  class="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-muted transition">
                            PDF English
                          </button>
                          <button (click)="pickDownload('docx', 'en')"
                                  class="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-muted transition">
                            DOCX English
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (analysis(); as a) {
              <div class="grid gap-6 lg:grid-cols-3">

                <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-1">
                  <p class="text-xs font-semibold uppercase text-ink-muted">ATS Score</p>
                  <div class="mt-4 flex items-end gap-2">
                    <span class="text-6xl font-bold text-brand-primary">{{ a.atsScore }}</span>
                    <span class="pb-2 text-2xl text-ink-muted">/100</span>
                  </div>
                  <div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div class="h-full bg-gradient-to-r from-brand-primary to-brand-hover"
                         [style.width.%]="a.atsScore"></div>
                  </div>
                  @if (a.atsReport?.improvements?.length) {
                    <div class="mt-6">
                      <p class="text-xs font-semibold uppercase text-ink-muted mb-3">Top melhorias</p>
                      <ul class="space-y-2 text-sm text-ink-muted">
                        @for (i of a.atsReport.improvements.slice(0, 3); track i) {
                          <li>• {{ i }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>

                <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-2">
                  <h3 class="font-semibold text-ink mb-4">Problemas encontrados</h3>
                  @if (a.atsReport?.formattingIssues?.length) {
                    <ul class="space-y-2">
                      @for (issue of a.atsReport.formattingIssues; track issue) {
                        <li class="flex gap-3 text-sm text-ink-muted">
                          <span class="text-state-error">●</span>
                          {{ issue }}
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="text-sm text-ink-muted">Nenhum problema crítico detectado.</p>
                  }
                  @if (a.atsReport?.missingKeywords?.length) {
                    <h4 class="mt-6 font-semibold text-ink mb-2">Palavras-chave ausentes</h4>
                    <div class="flex flex-wrap gap-2">
                      @for (k of a.atsReport.missingKeywords; track k) {
                        <span class="rounded-full bg-brand-primary/10 px-3 py-1 text-xs text-brand-primary">
                          {{ k }}
                        </span>
                      }
                    </div>
                  }
                </div>

                <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-3">
                  <h3 class="font-semibold text-ink mb-4 flex items-center gap-2">
                    <ng-icon name="heroEye" size="18" class="text-ink-muted"></ng-icon>
                    Visão do Recrutador
                  </h3>
                  <div class="grid gap-6 md:grid-cols-2">
                    <div>
                      <p class="text-sm font-semibold text-state-success mb-2">Pontos fortes</p>
                      <ul class="space-y-1 text-sm text-ink-muted">
                        @for (s of a.recruiterFeedback?.strengths || []; track s) {
                          <li>✓ {{ s }}</li>
                        }
                      </ul>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-state-error mb-2">Pontos fracos</p>
                      <ul class="space-y-1 text-sm text-ink-muted">
                        @for (w of a.recruiterFeedback?.weaknesses || []; track w) {
                          <li>✗ {{ w }}</li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>

                @if (d.jobMatches?.[0]) {
                  <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-3">
                    <h3 class="font-semibold text-ink mb-4 flex items-center gap-2">
                      <ng-icon name="heroBolt" size="18" class="text-ink-muted"></ng-icon>
                      Match com a vaga
                    </h3>
                    <div class="flex items-center gap-6">
                      <div class="text-5xl font-bold text-brand-primary">
                        {{ d.jobMatches[0].matchScore }}%
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-ink-muted">
                          {{ d.jobMatches[0].suggestions?.length || 0 }}
                          sugestões para aumentar seu match
                        </p>
                      </div>
                    </div>
                  </div>
                }

                <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-3">
                  <h3 class="font-semibold text-ink mb-4 flex items-center gap-2">
                    <ng-icon name="heroLightBulb" size="18" class="text-ink-muted"></ng-icon>
                    Sugestões de inovação
                  </h3>
                  @if (a.innovationTips?.headline) {
                    <p class="text-sm text-ink-muted mb-2">
                      <strong class="text-ink">Nova headline:</strong>
                      {{ a.innovationTips.headline }}
                    </p>
                  }
                  @if (a.innovationTips?.linkedinHeadline) {
                    <p class="text-sm text-ink-muted mb-2">
                      <strong class="text-ink">LinkedIn headline:</strong>
                      {{ a.innovationTips.linkedinHeadline }}
                    </p>
                  }
                  @if (a.innovationTips?.trendingSkills?.length) {
                    <div class="mt-4">
                      <p class="text-xs font-semibold uppercase text-ink-muted mb-2">Skills em alta</p>
                      <div class="flex flex-wrap gap-2">
                        @for (s of a.innovationTips.trendingSkills; track s) {
                          <span class="rounded-full bg-surface-muted px-3 py-1 text-xs text-ink">{{ s }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>

                <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-3">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="font-semibold text-ink flex items-center gap-2">
                      <ng-icon name="heroDocumentText" size="18" class="text-ink-muted"></ng-icon>
                      Preview do currículo otimizado
                    </h3>
                    <span class="text-xs text-ink-muted">Assim vai ficar no PDF/DOCX</span>
                  </div>

                  @if (rewritten(); as r) {
                    <div class="mx-auto max-w-2xl bg-white border border-surface-border rounded-xl px-12 py-10 shadow-sm">
                      <div class="text-center pb-4 border-b border-surface-border">
                        <h2 class="text-2xl font-bold text-ink tracking-tight">{{ contactName() }}</h2>
                        @if (r.headline) {
                          <p class="mt-1 text-sm text-ink-muted">{{ r.headline }}</p>
                        }
                        @if (contactLine()) {
                          <p class="mt-2 text-xs text-ink-muted">{{ contactLine() }}</p>
                        }
                      </div>

                      @if (r.summary) {
                        <div class="mt-6">
                          <h4 class="text-[11px] font-bold text-ink uppercase tracking-widest pb-1 border-b border-surface-border">
                            Resumo Profissional
                          </h4>
                          <p class="mt-3 text-xs text-ink leading-relaxed text-justify">{{ r.summary }}</p>
                        </div>
                      }

                      @if (r.experience?.length) {
                        <div class="mt-6">
                          <h4 class="text-[11px] font-bold text-ink uppercase tracking-widest pb-1 border-b border-surface-border">
                            Experiência Profissional
                          </h4>
                          <div class="mt-3 space-y-4">
                            @for (exp of r.experience; track exp.role) {
                              <div>
                                <div class="flex items-start justify-between gap-3">
                                  <p class="text-xs font-bold text-ink flex-1">{{ exp.role }}</p>
                                  @if (exp.period) {
                                    <p class="text-[10px] text-ink-muted shrink-0">{{ exp.period }}</p>
                                  }
                                </div>
                                @if (exp.company) {
                                  <p class="text-xs italic text-ink-muted mt-0.5">{{ exp.company }}</p>
                                }
                                @if (exp.bullets?.length) {
                                  <ul class="mt-2 space-y-1">
                                    @for (b of exp.bullets; track b) {
                                      <li class="text-xs text-ink flex gap-2 leading-relaxed">
                                        <span class="text-ink-muted">•</span>
                                        <span class="flex-1">{{ b }}</span>
                                      </li>
                                    }
                                  </ul>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      }

                      @if (r.education?.length) {
                        <div class="mt-6">
                          <h4 class="text-[11px] font-bold text-ink uppercase tracking-widest pb-1 border-b border-surface-border">
                            Formação Acadêmica
                          </h4>
                          <div class="mt-3 space-y-3">
                            @for (ed of r.education; track ed.degree) {
                              <div>
                                <div class="flex items-start justify-between gap-3">
                                  <p class="text-xs font-bold text-ink flex-1">{{ ed.degree }}</p>
                                  @if (ed.period) {
                                    <p class="text-[10px] text-ink-muted shrink-0">{{ ed.period }}</p>
                                  }
                                </div>
                                @if (ed.school) {
                                  <p class="text-xs italic text-ink-muted mt-0.5">{{ ed.school }}</p>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      }

                      @if (r.skills?.length) {
                        <div class="mt-6">
                          <h4 class="text-[11px] font-bold text-ink uppercase tracking-widest pb-1 border-b border-surface-border">
                            Habilidades
                          </h4>
                          <p class="mt-3 text-xs text-ink leading-relaxed">
                            {{ r.skills.join('  •  ') }}
                          </p>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-sm text-ink-muted text-center py-8">Nenhuma versão otimizada disponível ainda.</p>
                  }
                </div>

                @if (d.coverLetters?.length) {
                  <div class="rounded-2xl bg-white border border-surface-border p-8 lg:col-span-3">
                    <h3 class="font-semibold text-ink mb-4 flex items-center gap-2">
                      <ng-icon name="heroEnvelope" size="18" class="text-ink-muted"></ng-icon>
                      Carta de apresentação
                    </h3>
                    <pre class="whitespace-pre-wrap font-sans text-sm text-ink-muted">{{ d.coverLetters[0].content }}</pre>
                  </div>
                }

              </div>
            } @else {
              <p class="text-ink-muted">Nenhuma análise encontrada.</p>
            }
          } @else {
            <p class="text-ink-muted">Nenhum currículo encontrado.</p>
          }
        }
      </div>
    </section>
  `,
})
export class AnalysisComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private resumeService = inject(ResumeService);

  data = signal<any>(null);
  loading = signal(true);
  generatingCover = signal(false);
  downloading = signal(false);
  sharing = signal(false);
  shareToken = signal<string | null>(null);
  moreMenuOpen = signal(false);
  downloadMenuOpen = signal(false);

  toggleMoreMenu(event: Event) {
    event.stopPropagation();
    this.downloadMenuOpen.set(false);
    this.moreMenuOpen.update((v) => !v);
  }

  toggleDownloadMenu(event: Event) {
    event.stopPropagation();
    this.moreMenuOpen.set(false);
    this.downloadMenuOpen.update((v) => !v);
  }

  pickDownload(format: 'pdf' | 'docx', language: 'pt' | 'en') {
    this.downloadMenuOpen.set(false);
    this.downloadFile(format, language);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.moreMenuOpen.set(false);
    this.downloadMenuOpen.set(false);
  }

  toggleShare() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sharing.set(true);
    this.resumeService.createShare(id).subscribe({
      next: (res) => {
        const url = `${window.location.origin}/cv/${res.token}`;
        navigator.clipboard.writeText(url);
        this.shareToken.set(res.token);
        this.sharing.set(false);
        setTimeout(() => this.shareToken.set(null), 3000);
      },
      error: () => this.sharing.set(false),
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.resumeService.get(id).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  analysis() {
    return this.data()?.analyses?.[0];
  }

  rewritten() {
    return this.analysis()?.rewrittenResume;
  }

  contactName() {
    return this.rewritten()?.contact?.name || 'Nome do Candidato';
  }

  contactLine() {
    const c = this.rewritten()?.contact;
    if (!c) return '';
    const parts: string[] = [];
    if (c.email) parts.push(c.email);
    if (c.phone) parts.push(c.phone);
    if (c.location) parts.push(c.location);
    return parts.join('  •  ');
  }

  downloadFile(format: 'pdf' | 'docx', language: 'pt' | 'en' = 'pt') {
    const id = this.route.snapshot.paramMap.get('id')!;
    const title = this.data()?.title || 'curriculo';
    this.downloading.set(true);
    this.resumeService.download(id, format, language).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const suffix = language === 'en' ? '_english' : '_otimizado';
        a.download = title.replace(/\.[^/.]+$/, '') + suffix + '.' + format;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false),
    });
  }

  hasEnglishVersion() {
    return this.data()?.versions?.some((v: any) => v.label?.startsWith('English'));
  }

  generateCoverLetter() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const job = this.data()?.jobMatches?.[0]?.jobDescription;
    this.generatingCover.set(true);
    this.resumeService.generateCoverLetter(id, job).subscribe({
      next: () => {
        this.generatingCover.set(false);
        this.load();
      },
      error: () => {
        this.generatingCover.set(false);
      },
    });
  }
}