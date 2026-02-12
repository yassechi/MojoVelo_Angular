import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';
import { UserService, User } from '../../../core/services/user.service';
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
  selector: 'app-manager-contrats',
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
  providers: [MessageService, ConfirmationService],
  templateUrl: './manager-contrats.component.html',
  styleUrls: ['./manager-contrats.component.scss'],
})
export class ContratsComponent implements OnInit {
  contrats: Contrat[] = [];
  loading = false;
  users: User[] = [];
  currentUserOrgId: number | null = null;

  constructor(
    private contratService: ContratService,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserOrg();
    this.loadContrats();
    this.loadUsers();
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

  loadContrats(): void {
    this.loading = true;
    this.contratService.getAll().subscribe({
      next: (data) => {
        // ✅ Filtrer par organisation du Manager
        if (this.currentUserOrgId) {
          this.contrats = data.filter(c => {
            // TODO: Adapter selon votre structure - vérifier si Contrat a organisationId
            return (c as any).organisationId === this.currentUserOrgId;
          });
        } else {
          this.contrats = data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des contrats', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les contrats',
        });
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        // ✅ Filtrer users de la même organisation
        if (this.currentUserOrgId) {
          this.users = data.filter(u => {
            const orgId = typeof u.organisationId === 'object'
              ? (u.organisationId as any).id
              : u.organisationId;
            return orgId === this.currentUserOrgId;
          });
        } else {
          this.users = data;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
    });
  }

  onDelete(contrat: Contrat): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le contrat "${contrat.ref}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.contratService.delete(contrat.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Contrat supprimé',
            });
            this.loadContrats();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer le contrat',
            });
          },
        });
      },
    });
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Termine:
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  getUserFullName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }
}
