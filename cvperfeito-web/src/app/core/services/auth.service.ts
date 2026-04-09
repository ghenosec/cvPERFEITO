import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  creditsLeft: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  token = signal<string | null>(localStorage.getItem('cv_token'));
  user = signal<User | null>(null);

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
  }

  private persist(token: string, user: User) {
    localStorage.setItem('cv_token', token);
    this.token.set(token);
    this.user.set(user);
  }
}
