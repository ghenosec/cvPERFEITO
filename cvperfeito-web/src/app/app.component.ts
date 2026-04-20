import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col">
      @if (auth.token()) {
        <header class="border-b border-surface-border bg-white sticky top-0 z-40">
          <div class="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <a routerLink="/dashboard" class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold">cv</div>
              <span class="font-bold text-lg">
                <span class="text-black">cv</span><span class="text-brand-primary">PERFEITO</span>
              </span>
            </a>
            <nav class="flex items-center gap-6">
              <a routerLink="/dashboard" class="text-sm text-ink-muted hover:text-brand-primary transition">Dashboard</a>
              <a routerLink="/upload" class="text-sm text-ink-muted hover:text-brand-primary transition">Novo</a>

              <a routerLink="/billing" class="flex items-center gap-2 rounded-full border border-surface-border px-3 py-1.5 hover:border-brand-primary transition group">
                <span class="text-[10px] font-bold uppercase tracking-wider"
                      [class.text-ink-muted]="isFree()"
                      [class.text-brand-primary]="!isFree()">
                  {{ planLabel() }}
                </span>
                <span class="h-3 w-px bg-surface-border"></span>
                <span class="text-xs font-semibold text-ink">
                  {{ auth.user()?.creditsLeft ?? 0 }}
                </span>
                <span class="text-[10px] text-ink-muted">créditos</span>
              </a>

              <button (click)="logout()" class="text-sm text-ink-muted hover:text-state-error transition">Sair</button>
            </nav>
          </div>
        </header>
      }
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  isFree = computed(() => this.auth.user()?.plan === 'FREE');

  planLabel = computed(() => {
    const plan = this.auth.user()?.plan;
    if (plan === 'PREMIUM') return 'Premium';
    if (plan === 'BASIC') return 'Básico';
    return 'Gratuito';
  });

  constructor() {
    if (this.auth.token()) {
      this.auth.fetchMe().subscribe();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
