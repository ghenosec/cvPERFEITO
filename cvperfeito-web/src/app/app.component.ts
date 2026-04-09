import { Component, inject } from '@angular/core';
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
        <header class="border-b border-surface-border bg-white sticky top-0 z-50">
          <div class="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <a routerLink="/dashboard" class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold">cv</div>
              <span class="font-bold text-lg text-ink">cvPERFEITO</span>
            </a>
            <nav class="flex items-center gap-6">
              <a routerLink="/dashboard" class="text-sm text-ink-muted hover:text-brand-primary transition">Dashboard</a>
              <a routerLink="/upload" class="text-sm text-ink-muted hover:text-brand-primary transition">Novo</a>
              <a routerLink="/billing" class="text-sm text-ink-muted hover:text-brand-primary transition">Comprar análise</a>
              <div class="flex items-center gap-3">
                <span class="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                  {{ auth.user()?.creditsLeft ?? 0 }} crédito(s)
                </span>
                <button (click)="logout()" class="text-sm text-ink-muted hover:text-state-error transition">Sair</button>
              </div>
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
