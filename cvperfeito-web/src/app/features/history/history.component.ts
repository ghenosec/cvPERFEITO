import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="px-6 py-12">
      <div class="mx-auto max-w-5xl">
        <a routerLink="/dashboard" class="text-sm text-ink-muted hover:text-brand-primary">← Voltar</a>
        <h1 class="text-3xl font-bold text-ink mt-2 mb-2">Histórico de versões</h1>
        <p class="text-ink-muted mb-8">Todas as versões do seu currículo, da mais antiga para a mais recente.</p>

        @if (loading()) {
          <p class="text-ink-muted">Carregando...</p>
        } @else {
          <div class="space-y-4">
            @for (v of versions(); track v.id; let i = $index) {
              <div class="rounded-2xl bg-white border border-surface-border overflow-hidden">
                <div class="bg-surface-muted px-6 py-3 border-b border-surface-border flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="rounded-full bg-brand-primary text-white text-xs font-bold w-7 h-7 flex items-center justify-center">
                      {{ i + 1 }}
                    </span>
                    <div>
                      <h3 class="font-semibold text-ink">{{ v.label }}</h3>
                      <p class="text-xs text-ink-muted">{{ v.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                  </div>
                  <button (click)="toggle(v.id)" class="text-sm text-brand-primary hover:underline">
                    {{ expanded() === v.id ? 'Ocultar' : 'Ver conteúdo' }}
                  </button>
                </div>
                @if (expanded() === v.id) {
                  <div class="p-6">
                    <pre class="whitespace-pre-wrap font-sans text-sm text-ink-muted leading-relaxed max-h-96 overflow-y-auto">{{ v.content }}</pre>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class HistoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private resumeService = inject(ResumeService);

  versions = signal<any[]>([]);
  loading = signal(true);
  expanded = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.resumeService.history(id).subscribe({
      next: (data) => {
        this.versions.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(id: string) {
    this.expanded.set(this.expanded() === id ? null : id);
  }
}
