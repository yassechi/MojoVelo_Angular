import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User, UserRole } from '../../../core/services/user.service';
import { EmployeFormDialogComponent } from '../../Admin/employes/employe-form-dialog/admin-employe-form-dialog';
import { AuthService } from '../../../core/services/auth.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-manager-employes',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    EmployeFormDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manager-employes.component.html',
  styleUrls: ['./manager-employes.component.scss'],
})
export class EmployesComponent implements OnInit {
  employes: User[] = [];
  loading = false;
  dialogVisible = false;
  selectedUser: User | null = null;
  currentUserOrgId: number | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserOrg();
    this.loadEmployes();
  }

loadCurrentUserOrg(): void {
  const user = this.authService.getCurrentUser();
  if (!user) return;

  if (user.organisationId) {
    this.currentUserOrgId = typeof user.organisationId === 'object'
      ? (user.organisationId as any).id
      : user.organisationId;
  }
}

  loadEmployes(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        // ✅ Filtrer: seulement les User (pas Manager/Admin) de la même organisation
        this.employes = data.filter(u => {
          const orgId = typeof u.organisationId === 'object' ? u.organisationId.id : u.organisationId;
          return u.role === UserRole.User && orgId === this.currentUserOrgId;
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les employés',
        });
        this.loading = false;
      },
    });
  }

  onCreate(): void {
    this.selectedUser = null;
    this.dialogVisible = true;
  }

  onEdit(user: User): void {
    this.selectedUser = user;
    this.dialogVisible = true;
  }

  onSave(): void {
    this.loadEmployes();
  }

 onDelete(user: User): void {
  if (!user.id) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'ID utilisateur manquant',
    });
    return;
  }

  this.confirmationService.confirm({
    message: `Êtes-vous sûr de vouloir supprimer l'employé "${user.firstName} ${user.lastName}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui',
    rejectLabel: 'Non',
    accept: () => {
      this.userService.delete(user.id!).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Employé supprimé',
          });
          this.loadEmployes();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer l\'employé',
          });
        },
      });
    },
  });
}

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'Administrateur';
      case UserRole.Manager:
        return 'Manager';
      case UserRole.User:
        return 'Utilisateur';
      default:
        return 'Inconnu';
    }
  }

  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case UserRole.Admin:
        return 'danger';
      case UserRole.Manager:
        return 'warn';
      case UserRole.User:
        return 'info';
      default:
        return 'secondary';
    }
  }

  getOrganisationName(user: User): string {
    if (user.organisationId && typeof user.organisationId === 'object') {
      return (user.organisationId as any).name || 'N/A';
    }
    return 'N/A';
  }
}
