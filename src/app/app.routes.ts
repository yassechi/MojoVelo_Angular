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
import { DemandeFormDialogComponent } from './shared/components/demande-form/admin-demande-form-dialog';
import { DemandeDetailComponent } from './shared/components/demande-detail/admin-demande-detail.component';
import { AdminContratsComponent } from './features/Admin/contrats/admin-contrats.component';
import { AdminParametresComponent } from './features/Admin/parametres/admin-parametres.component';
import { ContratDetailComponent } from './features/Admin/contrats/contrat-detail/admin-contrat-detail.component';
import { ContratDetailInfoComponent } from './features/Admin/contrats/contrat-detail/contrat-detail-info.component';
import { ContratDocumentsComponent } from './features/Admin/contrats/contrat-detail/contrat-documents.component';
import { ContratEntretienComponent } from './features/Admin/contrats/contrat-detail/contrat-entretien.component';
import { ContratAmortissementComponent } from './features/Admin/contrats/contrat-detail/contrat-amortissement.component';

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
import { CompagnieFormComponent } from './features/Admin/compagnies/compagnie-form/admin-compagnie-form.component';
import { EmployeFormDialogComponent } from './shared/components/employe-form/admin-employe-form-dialog';
import { UserDemandeFormDialogComponent } from './features/User/demandes/user-demande-form-dialog/user-demande-form-dialog';
import { EmployeDetailComponent } from './shared/components/employe-detail/admin-employe-detail.component';
import { CompagnieDetailComponent } from './features/Admin/compagnies/compagnie-detail/admin-compagnie-detail.component';


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
      { path: 'compagnies/new', component: CompagnieFormComponent },
      { path: 'compagnies/:id/edit', component: CompagnieFormComponent },
      { path: 'compagnies/:id', component: CompagnieDetailComponent },
      { path: 'employes', component: AdminEmployesComponent },
      { path: 'employes/new', component: EmployeFormDialogComponent },
      { path: 'employes/:id/edit', component: EmployeFormDialogComponent },
      { path: 'employes/:id', component: EmployeDetailComponent },
      { path: 'demandes', component: AdminDemandesComponent },
      { path: 'demandes/new', component: DemandeFormDialogComponent },
      { path: 'demandes/:id/edit', component: DemandeFormDialogComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
      { path: 'contrats', component: AdminContratsComponent },
      { path: 'contrats/edit/:id', component: ContratEditComponent },
      {
        path: 'contrats/:id',
        component: ContratDetailComponent,
        children: [
          { path: '', redirectTo: 'detail', pathMatch: 'full' },
          { path: 'detail', component: ContratDetailInfoComponent },
          { path: 'documents', component: ContratDocumentsComponent },
          { path: 'entretien', component: ContratEntretienComponent },
          { path: 'amortissement', component: ContratAmortissementComponent },
        ],
      },
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
      { path: 'employes/new', component: EmployeFormDialogComponent },
      { path: 'employes/:id/edit', component: EmployeFormDialogComponent },
      { path: 'employes/:id', component: EmployeDetailComponent },
      { path: 'demandes', component: ManagerDemandesComponent },
      { path: 'demandes/new', component: DemandeFormDialogComponent },
      { path: 'demandes/:id/edit', component: DemandeFormDialogComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
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
      { path: 'demandes/new', component: UserDemandeFormDialogComponent },
      { path: 'demandes/:id/edit', component: UserDemandeFormDialogComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
      { path: 'parametres', component: UserParametresComponent },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
