import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="px-6 py-12">
      <div class="mx-auto max-w-7xl">
        <a routerLink="/dashboard" class="text-sm text-ink-muted hover:text-brand-primary">
          Voltar
        </a>

        <h1 class="mt-2 mb-8 text-3xl font-bold text-ink">
          Comparação lado a lado
        </h1>

        @if (loading()) {
          <div class="space-y-8 animate-fade">
            <div class="rounded-2xl border border-surface-border bg-white p-6">
              <div class="flex items-center gap-3">
                <div class="h-5 w-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin"></div>
                <p class="text-sm font-medium text-ink">Preparando comparação do currículo...</p>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              @for (card of [1, 2]; track card) {
                <div class="overflow-hidden rounded-2xl border border-surface-border bg-white">
                  <div class="flex items-center justify-between border-b border-surface-border px-6 py-4">
                    <div class="loading-shimmer h-5 w-40 rounded-full"></div>
                    <div class="loading-shimmer h-4 w-28 rounded-full"></div>
                  </div>

                  <div class="space-y-3 p-6">
                    @for (line of [1, 2, 3, 4, 5, 6, 7, 8]; track line) {
                      <div class="loading-shimmer h-4 rounded-full"
                           [style.width.%]="skeletonWidth(line)"></div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              @for (stat of [1, 2, 3]; track stat) {
                <div class="rounded-2xl border border-surface-border bg-white p-4">
                  <div class="loading-shimmer h-4 w-24 rounded-full"></div>
                  <div class="loading-shimmer mt-4 h-8 w-16 rounded-full"></div>
                </div>
              }
            </div>
          </div>
        } @else {
          @if (data(); as d) {
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="overflow-hidden rounded-2xl border border-surface-border bg-white">
                <div class="flex items-center justify-between border-b border-surface-border bg-surface-muted px-6 py-3">
                  <h3 class="font-semibold text-ink">Original</h3>
                  <span class="text-xs text-ink-muted">Versão enviada</span>
                </div>

                <div class="max-h-[70vh] overflow-y-auto p-6">
                  <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-muted">
{{ d.original }}
                  </pre>
                </div>
              </div>

              <div class="overflow-hidden rounded-2xl border-2 border-brand-primary bg-white">
                <div class="flex items-center justify-between border-b border-brand-primary/20 bg-brand-primary/10 px-6 py-3">
                  <h3 class="font-semibold text-brand-primary">Otimizado pela IA</h3>
                  <span class="text-xs font-semibold text-brand-primary">Versão melhorada</span>
                </div>

                <div class="max-h-[70vh] overflow-y-auto p-6">
                  @if (optimizedText()) {
                    <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
{{ optimizedText() }}
                    </pre>
                  } @else {
                    <p class="text-sm italic text-ink-muted">
                      Nenhuma versão otimizada ainda. Vá ao dashboard e analise este currículo primeiro.
                    </p>
                  }
                </div>
              </div>
            </div>

            @if (d.analysis) {
              <div class="mt-8 rounded-2xl border border-surface-border bg-white p-8">
                <h3 class="mb-4 font-semibold text-ink">Resumo das mudanças</h3>

                <div class="grid gap-4 md:grid-cols-3">
                  <div class="rounded-xl bg-surface-muted p-4">
                    <p class="text-xs text-ink-muted">Score ATS</p>
                    <p class="mt-1 text-2xl font-bold text-brand-primary">
                      {{ d.analysis.atsScore }}/100
                    </p>
                  </div>

                  <div class="rounded-xl bg-surface-muted p-4">
                    <p class="text-xs text-ink-muted">Palavras-chave adicionadas</p>
                    <p class="mt-1 text-2xl font-bold text-ink">
                      {{ d.analysis.atsReport?.missingKeywords?.length || 0 }}
                    </p>
                  </div>

                  <div class="rounded-xl bg-surface-muted p-4">
                    <p class="text-xs text-ink-muted">Melhorias aplicadas</p>
                    <p class="mt-1 text-2xl font-bold text-ink">
                      {{ d.analysis.atsReport?.improvements?.length || 0 }}
                    </p>
                  </div>
                </div>
              </div>
            }
          } @else {
            <p class="text-ink-muted">Nenhum dado encontrado.</p>
          }
        }
      </div>
    </section>
  `,
})
export class CompareComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private resumeService = inject(ResumeService);

  data = signal<any>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      compare: this.resumeService.compare(id),
      resume: this.resumeService.get(id),
    }).subscribe({
      next: ({ compare, resume }) => {
        const analysis = compare.analysis ?? resume?.analyses?.[0] ?? null;
        const optimizedInPortuguese = this.buildResumeText(analysis?.rewrittenResume);

        this.data.set({
          ...compare,
          analysis,
          optimized: optimizedInPortuguese || compare.optimized,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  optimizedText() {
    return this.data()?.optimized?.trim?.() || '';
  }

  skeletonWidth(line: number) {
    if (line < 3) return 100;
    if (line === 3 || line === 6) return 92;
    if (line === 4 || line === 7) return 84;
    return 68;
  }

  private buildResumeText(rewritten: any): string {
    if (!rewritten) return '';

    const sections: string[] = [];
    const contact = rewritten.contact ?? {};
    const intro = [
      contact.name,
      rewritten.headline,
      contact.location,
      contact.phone,
      contact.email,
      contact.linkedin,
      contact.portfolio,
    ].filter(Boolean);

    if (intro.length) {
      sections.push(intro.join('\n'));
    }

    if (rewritten.summary) {
      sections.push(`RESUMO PROFISSIONAL\n${rewritten.summary}`);
    }

    if (rewritten.experience?.length) {
      const experience = rewritten.experience
        .map((item: any) => {
          const header = [item.role, item.company].filter(Boolean).join(' - ');
          const details = [header, item.period].filter(Boolean);
          const bullets = (item.bullets ?? []).map((bullet: string) => `- ${bullet}`);
          return [...details, ...bullets].join('\n');
        })
        .filter(Boolean)
        .join('\n\n');

      if (experience) {
        sections.push(`EXPERIÊNCIA PROFISSIONAL\n${experience}`);
      }
    }

    if (rewritten.education?.length) {
      const education = rewritten.education
        .map((item: any) => {
          const header = [item.degree, item.school].filter(Boolean).join(' - ');
          return [header, item.period].filter(Boolean).join('\n');
        })
        .filter(Boolean)
        .join('\n\n');

      if (education) {
        sections.push(`FORMAÇÃO ACADÊMICA\n${education}`);
      }
    }

    if (rewritten.skills?.length) {
      sections.push(`HABILIDADES\n${rewritten.skills.join(', ')}`);
    }

    return sections.join('\n\n').trim();
  }
}
