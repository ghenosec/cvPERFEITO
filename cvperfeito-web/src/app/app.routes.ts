import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
  path: 'cv/:token',
  loadComponent: () =>
    import('./features/public-resume/public-resume.component').then(
      (m) => m.PublicResumeComponent,
    ),
},

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/upload-resume/upload-resume.component').then((m) => m.UploadResumeComponent),
  },
  {
    path: 'analysis/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/analysis/analysis.component').then((m) => m.AnalysisComponent),
  },
  {
    path: 'compare/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/compare/compare.component').then((m) => m.CompareComponent),
  },
  {
    path: 'history/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'billing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/billing.component').then((m) => m.BillingComponent),
  },
  {
    path: 'billing/success',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/billing-success.component').then((m) => m.BillingSuccessComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
