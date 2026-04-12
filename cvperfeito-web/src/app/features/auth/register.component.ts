import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="min-h-screen flex items-center justify-center bg-surface-muted px-6 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-flex h-14 w-14 rounded-2xl bg-brand-primary items-center justify-center text-white text-2xl font-bold">cv</div>
          <h1 class="mt-4 text-3xl font-bold text-ink">Criar conta</h1>
          <p class="mt-2 text-ink-muted">Ganhe <span class="text-brand-primary font-semibold">1 análise grátis</span> ao se cadastrar</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-surface-border p-8">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink mb-2">Nome</label>
              <input
                [(ngModel)]="name"
                type="text"
                placeholder="Seu nome"
                class="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-hover/30">
            </div>
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
                placeholder="Mínimo 6 caracteres"
                class="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-hover/30">
            </div>

            <div class="flex items-start gap-3 mt-4">
              <input
                type="checkbox"
                [(ngModel)]="acceptedTerms"
                class="mt-0.5 h-4 w-4 rounded border-surface-border text-brand-primary focus:ring-brand-primary">
              <p class="text-xs text-ink-muted leading-relaxed">
                Ao continuar, você declara que leu e concorda com nossos
                <a routerLink="/termos" target="_blank" class="text-brand-primary underline">Termos de Uso</a>
                e
                <a routerLink="/privacidade" target="_blank" class="text-brand-primary underline">Política de Privacidade</a>,
                autorizando o tratamento dos seus dados pessoais conforme descrito nesses documentos,
                nos termos da Lei Geral de Proteção de Dados (LGPD).
              </p>
            </div>

            @if (error()) {
              <div class="rounded-xl bg-state-error/10 px-4 py-3 text-sm text-state-error">
                {{ error() }}
              </div>
            }

            <div class="flex items-start gap-2 mt-4">
              <input type="checkbox" [(ngModel)]="acceptedTerms"
                    class="mt-1 h-4 w-4 rounded border-surface-border text-brand-primary focus:ring-brand-primary">
              <p class="text-xs text-ink-muted">
                Li e concordo com os
                <a href="/termos" target="_blank" class="text-brand-primary underline">Termos de Uso</a>
                e a
                <a href="/privacidade" target="_blank" class="text-brand-primary underline">Política de Privacidade</a>.
              </p>
            </div>

            <button
              (click)="submit()"
              [disabled]="loading()"
              class="w-full rounded-xl bg-brand-primary py-3 font-semibold text-white shadow hover:bg-brand-secondary transition disabled:opacity-50">
              {{ loading() ? 'Criando...' : 'Criar conta grátis' }}
            </button>
          </div>

          <p class="mt-6 text-center text-sm text-ink-muted">
            Já tem conta?
            <a routerLink="/auth/login" class="text-brand-primary font-medium hover:underline">Entrar</a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  acceptedTerms = false;

  submit() {
    if (!this.acceptedTerms) {
    this.error.set('Você precisa aceitar os Termos de Uso para continuar.');
    return;
}
    this.error.set(null);
    this.loading.set(true);
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Erro ao criar conta');
      },
    });
  }
}
