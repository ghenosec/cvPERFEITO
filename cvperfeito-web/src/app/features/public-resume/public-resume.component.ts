import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ResumeService } from '../../core/services/resume.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroLockClosed } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-public-resume',
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ heroLockClosed })],
  template: `
    <section class="min-h-screen bg-surface-muted py-12 px-4">
      @if (loading()) {
        <p class="text-center text-ink-muted">Carregando...</p>
      } @else {
        @if (data(); as d) {
          <div class="mx-auto max-w-3xl bg-white rounded-2xl shadow-lg px-14 py-14">
            <div class="text-center pb-6 border-b border-surface-border">
              <h1 class="text-3xl font-bold text-ink">{{ d.contact.name || 'Candidato' }}</h1>
              @if (d.rewritten.headline) {
                <p class="mt-2 text-base text-ink-muted">{{ d.rewritten.headline }}</p>
              }
              <p class="mt-3 text-sm text-ink-muted">
                {{ contactLine(d.contact) }}
              </p>
            </div>

            @if (d.rewritten.summary) {
              <section class="mt-8">
                <h2 class="text-xs font-bold uppercase tracking-widest text-ink pb-2 border-b border-surface-border">
                  Resumo Profissional
                </h2>
                <p class="mt-4 text-sm text-ink leading-relaxed text-justify">{{ d.rewritten.summary }}</p>
              </section>
            }

            @if (d.rewritten.experience?.length) {
              <section class="mt-8">
                <h2 class="text-xs font-bold uppercase tracking-widest text-ink pb-2 border-b border-surface-border">
                  Experiência Profissional
                </h2>
                <div class="mt-4 space-y-6">
                  @for (exp of d.rewritten.experience; track exp.role) {
                    <div>
                      <div class="flex justify-between items-start gap-4">
                        <h3 class="font-bold text-ink">{{ exp.role }}</h3>
                        @if (exp.period) {
                          <span class="text-xs text-ink-muted shrink-0">{{ exp.period }}</span>
                        }
                      </div>
                      @if (exp.company) {
                        <p class="italic text-ink-muted text-sm">{{ exp.company }}</p>
                      }
                      @if (exp.bullets?.length) {
                        <ul class="mt-2 space-y-1.5">
                          @for (b of exp.bullets; track b) {
                            <li class="text-sm text-ink flex gap-2">
                              <span class="text-ink-muted">•</span>
                              <span class="flex-1">{{ b }}</span>
                            </li>
                          }
                        </ul>
                      }
                    </div>
                  }
                </div>
              </section>
            }

            @if (d.rewritten.education?.length) {
              <section class="mt-8">
                <h2 class="text-xs font-bold uppercase tracking-widest text-ink pb-2 border-b border-surface-border">
                  Formação Acadêmica
                </h2>
                <div class="mt-4 space-y-3">
                  @for (ed of d.rewritten.education; track ed.degree) {
                    <div>
                      <div class="flex justify-between items-start gap-4">
                        <h3 class="font-bold text-ink">{{ ed.degree }}</h3>
                        @if (ed.period) {
                          <span class="text-xs text-ink-muted shrink-0">{{ ed.period }}</span>
                        }
                      </div>
                      @if (ed.school) {
                        <p class="italic text-ink-muted text-sm">{{ ed.school }}</p>
                      }
                    </div>
                  }
                </div>
              </section>
            }

            @if (d.rewritten.skills?.length) {
              <section class="mt-8">
                <h2 class="text-xs font-bold uppercase tracking-widest text-ink pb-2 border-b border-surface-border">
                  Habilidades
                </h2>
                <p class="mt-4 text-sm text-ink leading-relaxed">
                  {{ d.rewritten.skills.join('  •  ') }}
                </p>
              </section>
            }
          </div>

          <p class="text-center mt-8 text-xs text-ink-muted">
            Currículo gerado por <a href="/" class="text-brand-primary font-semibold">cvPERFEITO</a>
          </p>
        } @else {
          <div class="mx-auto max-w-md text-center py-20">
            <div class="flex justify-center mb-4">
                <ng-icon name="heroLockClosed" size="56" class="text-ink-muted"></ng-icon>
            </div>
            <h1 class="text-2xl font-bold text-ink">Link inválido</h1>
            <p class="mt-2 text-ink-muted">Este link de currículo não existe ou foi revogado.</p>
            </div>
        }
      }
    </section>
  `,
})
export class PublicResumeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private resumeService = inject(ResumeService);

  data = signal<any>(null);
  loading = signal(true);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token')!;
    this.resumeService.getPublic(token).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.data.set(null);
        this.loading.set(false);
      },
    });
  }

  contactLine(c: any) {
    const parts: string[] = [];
    if (c.email) parts.push(c.email);
    if (c.phone) parts.push(c.phone);
    if (c.location) parts.push(c.location);
    return parts.join('  •  ');
  }
}