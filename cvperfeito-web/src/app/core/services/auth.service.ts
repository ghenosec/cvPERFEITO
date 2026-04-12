import { Injectable, signal, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  creditsLeft: number;
}

declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private zone = inject(NgZone);


  token = signal<string | null>(localStorage.getItem('cv_token'));
  user = signal<User | null>(null);
  googleReady = signal(false);
  private googleCallbackRegistered = false;

  initGoogle(onSuccess?: () => void) {
    if (typeof google === 'undefined') return;
    if (this.googleCallbackRegistered) return;
    this.googleCallbackRegistered = true;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleResponse(response, onSuccess),
    });
    this.googleReady.set(true);
  }

  renderGoogleButton(elementId: string) {
    if (typeof google === 'undefined') return;
    const element = document.getElementById(elementId);
    if (!element) return;
    google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 380,
      locale: 'pt-BR',
    });
  }

  private handleGoogleResponse(response: any, onSuccess?: () => void) {
  if (!response.credential) return;
  this.zone.run(() => {
    this.http
      .post<{ accessToken: string; user: User }>(`${this.api}/auth/google`, {
        idToken: response.credential,
      })
      .subscribe({
        next: (res) => {
          this.persist(res.accessToken, res.user);
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.href = '/dashboard';
          }
        },
        error: (err) => console.error('Google login failed', err),
      });
  });
}

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string; user: User }>(`${this.api}/auth/login`, { email, password })
      .pipe(tap((res) => this.persist(res.accessToken, res.user)));
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<{ accessToken: string; user: User }>(`${this.api}/auth/register`, { name, email, password })
      .pipe(tap((res) => this.persist(res.accessToken, res.user)));
  }

  fetchMe() {
    return this.http
      .get<User>(`${this.api}/auth/me`)
      .pipe(tap((u) => this.user.set(u)));
  }

  logout() {
    localStorage.removeItem('cv_token');
    this.token.set(null);
    this.user.set(null);
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
  }

  private persist(token: string, user: User) {
    localStorage.setItem('cv_token', token);
    this.token.set(token);
    this.user.set(user);
  }
}