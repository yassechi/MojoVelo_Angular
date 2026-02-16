import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
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
import { TableauDeBordUtilisateurComponent } from './features/utilisateur/tableau-de-bord/utilisateur-tableau-de-bord.component';
import { ContratsUtilisateurComponent } from './features/utilisateur/contrats/utilisateur-contrats.component';
import { DemandesUtilisateurComponent } from './features/utilisateur/demandes/utilisateur-demandes.component';
import { DemandeAccueilUtilisateurComponent } from './features/utilisateur/demandes/demande-accueil/utilisateur-demande-accueil.component';
import { ParametresUtilisateurComponent } from './features/utilisateur/parametres/utilisateur-parametres.component';
import { ChoixParcoursUtilisateurComponent } from './features/utilisateur/choix-parcours/utilisateur-choix-parcours.component';
import { CatalogueVelosUtilisateurComponent } from './features/utilisateur/catalogue-velos/utilisateur-catalogue-velos.component';
import { QuestionnaireGuideUtilisateurComponent } from './features/utilisateur/questionnaire-guide/utilisateur-questionnaire-guide.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ContratEditComponent } from './features/Admin/contrats/contrat-edit/admin-contrat-edit.component';
import { CompagnieFormComponent } from './features/Admin/compagnies/compagnie-form/admin-compagnie-form.component';
import { EmployeFormDialogComponent } from './shared/components/employe-form/admin-employe-form-dialog';
import { DemandeFormulaireUtilisateurComponent } from './features/utilisateur/demandes/demande-formulaire/utilisateur-demande-formulaire.component';
import { EmployeDetailComponent } from './shared/components/employe-detail/admin-employe-detail.component';
import { CompagnieDetailComponent } from './features/Admin/compagnies/compagnie-detail/admin-compagnie-detail.component';
import { DemandeConfirmationUtilisateurComponent } from './features/utilisateur/demandes/demande-confirmation/utilisateur-demande-confirmation.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'faire-demande', component: DemandeAccueilUtilisateurComponent },
  { path: 'demande-formulaire', component: DemandeFormulaireUtilisateurComponent },
  { path: 'choix-parcours', component: ChoixParcoursUtilisateurComponent },
  { path: 'questionnaire-guide', component: QuestionnaireGuideUtilisateurComponent },
  { path: 'catalogue-velos', component: CatalogueVelosUtilisateurComponent },
  { path: 'demande-confirmation', component: DemandeConfirmationUtilisateurComponent },

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
      { path: 'contrats/new', component: ContratEditComponent },
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
      { path: 'dashboard', component: TableauDeBordUtilisateurComponent },
      { path: 'faire-demande', component: DemandeAccueilUtilisateurComponent },
      { path: 'contrats', component: ContratsUtilisateurComponent },
      { path: 'demandes', component: DemandesUtilisateurComponent },
      { path: 'demandes/new', component: DemandeFormulaireUtilisateurComponent },
      { path: 'demandes/:id/edit', component: DemandeFormulaireUtilisateurComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
      { path: 'parametres', component: ParametresUtilisateurComponent },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
