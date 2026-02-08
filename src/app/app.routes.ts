import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { AdminDashboardComponent } from './features/dashboard/admin-dashboard.component';
import { AdminCompagniesComponent } from './features/compagnies/admin-compagnies.component';
// import { AdminEmployesComponent } from './features/employes/admin-employes.component';
import { AdminDemandesComponent } from './features/demandes/admin-demande.component';
import { AdminContratsComponent } from './features/contrats/admin-contrats.component';
import { AdminParametresComponent } from './features/parametres/admin-parametres.component';
import { AdminEmployesComponent } from './features/employes/admin-employes.component';


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
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'compagnies', component: AdminCompagniesComponent },
      { path: 'employes', component: AdminEmployesComponent },
      { path: 'demandes', component: AdminDemandesComponent },
      { path: 'contrats', component: AdminContratsComponent },
      { path: 'parametres', component: AdminParametresComponent }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
