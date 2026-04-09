import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-screen flex items-center justify-center bg-surface-muted px-6">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-flex h-14 w-14 rounded-2xl bg-brand-primary items-center justify-center text-white text-2xl font-bold">cv</div>
          <h1 class="mt-4 text-3xl font-bold text-ink">Bem-vindo de volta</h1>
          <p class="mt-2 text-ink-muted">Entre na sua conta cvPERFEITO</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-surface-border p-8">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink mb-2">Email</label>
              <input
                [(ngModel)]="email"
                type="email"
                placeholder="voce@email.com"
                class="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-hover/30">
            </div>
            <div>
              <label class="block text-sm font-medium text-ink mb-2">Senha</label>
              <input
                [(ngModel)]="password"
                type="password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-hover/30">
            </div>

            @if (error()) {
              <div class="rounded-xl bg-state-error/10 px-4 py-3 text-sm text-state-error">
                {{ error() }}
              </div>
            }

            <button
              (click)="submit()"
              [disabled]="loading()"
              class="w-full rounded-xl bg-brand-primary py-3 font-semibold text-white shadow hover:bg-brand-secondary transition disabled:opacity-50">
              {{ loading() ? 'Entrando...' : 'Entrar' }}
            </button>
          </div>

          <p class="mt-6 text-center text-sm text-ink-muted">
            Não tem conta?
            <a routerLink="/auth/register" class="text-brand-primary font-medium hover:underline">Criar conta</a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.error.set(null);
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Erro ao entrar');
      },
    });
  }
}
