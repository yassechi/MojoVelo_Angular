import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User, UserRole } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

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
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './manager-employes.component.html',
  styleUrls: ['./manager-employes.component.scss'],
})
export class EmployesComponent implements OnInit {
  employes: User[] = [];
  loading = false;
  currentUserOrgId: number | null = null;

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadCurrentUserOrg();
    this.loadEmployes();
  }

  loadCurrentUserOrg(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }

    if (user.organisationId) {
      this.currentUserOrgId =
        typeof user.organisationId === 'object'
          ? (user.organisationId as any).id
          : user.organisationId;
    }
  }

  loadEmployes(): void {
    this.loading = true;
    if (!this.currentUserOrgId) {
      this.employes = [];
      this.loading = false;
      return;
    }

    this.userService.getByOrganisation(this.currentUserOrgId, UserRole.User).subscribe({
      next: (data) => {
        this.employes = data;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger les employes');
        this.loading = false;
      },
    });
  }

  onCreate(): void {
    this.router.navigate(['/manager/employes/new']);
  }

  onView(user: User): void {
    if (!user.id) {
      this.errorService.showError('ID utilisateur manquant');
      return;
    }
    this.router.navigate(['/manager/employes', user.id]);
  }

  onEdit(user: User): void {
    if (!user.id) {
      this.errorService.showError('ID utilisateur manquant');
      return;
    }
    this.router.navigate(['/manager/employes', user.id, 'edit']);
  }

  onDelete(user: User): void {
    if (!user.id) {
      this.errorService.showError('ID utilisateur manquant');
      return;
    }
    const userId = user.id;

    this.confirmationService.confirm({
      message: `Etes-vous sur de vouloir supprimer l'employe "${user.firstName} ${user.lastName}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.userService.delete(userId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Employe supprime',
            });
            this.loadEmployes();
          },
          error: () => {
            this.errorService.showError('Impossible de supprimer l\'employe');
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


