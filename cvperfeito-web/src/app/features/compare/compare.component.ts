import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="px-6 py-12">
      <div class="mx-auto max-w-7xl">
        <a routerLink="/dashboard" class="text-sm text-ink-muted hover:text-brand-primary">
          ← Voltar
        </a>

        <h1 class="text-3xl font-bold text-ink mt-2 mb-8">
          Comparação lado a lado
        </h1>

        @if (loading()) {
          <p class="text-ink-muted">Carregando comparação...</p>
        } @else {
          @if (data(); as d) {
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="rounded-2xl bg-white border border-surface-border overflow-hidden">
                <div class="bg-surface-muted px-6 py-3 border-b border-surface-border flex items-center justify-between">
                  <h3 class="font-semibold text-ink">📄 Original</h3>
                  <span class="text-xs text-ink-muted">Versão enviada</span>
                </div>

                <div class="p-6 max-h-[70vh] overflow-y-auto">
                  <pre class="whitespace-pre-wrap font-sans text-sm text-ink-muted leading-relaxed">
{{ d.original }}
                  </pre>
                </div>
              </div>

              <div class="rounded-2xl bg-white border-2 border-brand-primary overflow-hidden">
                <div class="bg-brand-primary/10 px-6 py-3 border-b border-brand-primary/20 flex items-center justify-between">
                  <h3 class="font-semibold text-brand-primary">✨ Otimizado pela IA</h3>
                  <span class="text-xs text-brand-primary font-semibold">Versão melhorada</span>
                </div>

                <div class="p-6 max-h-[70vh] overflow-y-auto">
                  @if (d.optimized) {
                    <pre class="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">
{{ d.optimized }}
                    </pre>
                  } @else {
                    <p class="text-sm text-ink-muted italic">
                      Nenhuma versão otimizada ainda. Vá ao dashboard e analise este currículo primeiro.
                    </p>
                  }
                </div>
              </div>
            </div>

            @if (d.analysis) {
              <div class="mt-8 rounded-2xl bg-white border border-surface-border p-8">
                <h3 class="font-semibold text-ink mb-4">Resumo das mudanças</h3>

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

    this.resumeService.compare(id).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}