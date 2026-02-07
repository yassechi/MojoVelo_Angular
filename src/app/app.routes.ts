import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CompagniesComponent } from './features/compagnies/compagnies.component';
import { authGuard } from './core/guards/auth.guard';
import { DemandesComponent } from './features/demandes/demande.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées avec layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'compagnies', component: CompagniesComponent },
      { path: 'demandes', component: DemandesComponent }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
