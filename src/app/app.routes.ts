import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';

// Admin Components
import { AdminDashboardComponent } from './features/Admin/dashboard/admin-dashboard.component';
import { AdminCompagniesComponent } from './features/Admin/compagnies/admin-compagnies.component';
import { AdminEmployesComponent } from './features/Admin/employes/admin-employes.component';
import { AdminDemandesComponent } from './features/Admin/demandes/admin-demande.component';
import { AdminContratsComponent } from './features/Admin/contrats/admin-contrats.component';
import { AdminParametresComponent } from './features/Admin/parametres/admin-parametres.component';
import { ContratDetailComponent } from './features/Admin/contrats/contrat-detail/admin-contrat-detail.component';

// Manager Components
import { DashboardComponent as ManagerDashboardComponent } from './features/Manager/dashboard/manager-dashboard.component';
import { DemandesComponent as ManagerDemandesComponent } from './features/Manager/demandes/manager-demandes.component';
import { ContratsComponent as ManagerContratsComponent } from './features/Manager/contrats/manager-contrats.component';
import { EmployesComponent as ManagerEmployesComponent } from './features/Manager/employes/manager-employes.component';
import { ParametresComponent as ManagerParametresComponent } from './features/Manager/parametres/manager-parametres.component';

// User Components
import { DashboardComponent as UserDashboardComponent } from './features/User/dashboard/user-dashboard.component';
import { ContratsComponent as UserContratsComponent } from './features/User/contrats/user-contrats.component';
import { DemandesComponent as UserDemandesComponent } from './features/User/demandes/user-demandes.component';
import { ParametresComponent as UserParametresComponent } from './features/User/parametres/user-parametres.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ContratEditComponent } from './features/Admin/contrats/contrat-edit/admin-contrat-edit.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Routes Admin
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'compagnies', component: AdminCompagniesComponent },
      { path: 'employes', component: AdminEmployesComponent },
      { path: 'demandes', component: AdminDemandesComponent },
      { path: 'contrats', component: AdminContratsComponent },
      { path: 'contrats/:id', component: ContratDetailComponent },
      { path: 'contrats/edit/:id', component: ContratEditComponent },
      { path: 'parametres', component: AdminParametresComponent },
    ],
  },

  // Routes Manager
  {
    path: 'manager',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ManagerDashboardComponent },
      { path: 'employes', component: ManagerEmployesComponent },
      { path: 'demandes', component: ManagerDemandesComponent },
      { path: 'contrats', component: ManagerContratsComponent },
      { path: 'parametres', component: ManagerParametresComponent },
    ],
  },

  // Routes User
  {
    path: 'user',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'contrats', component: UserContratsComponent },
      { path: 'demandes', component: UserDemandesComponent },
      { path: 'parametres', component: UserParametresComponent },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
