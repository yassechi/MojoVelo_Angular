import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService, User } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-contrats',
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
  templateUrl: './admin-contrats.component.html',
  styleUrls: ['./admin-contrats.component.scss'],
})
export class AdminContratsComponent implements OnInit {
  contrats: Contrat[] = [];
  loading = false;
  users: User[] = [];

  private contratService = inject(ContratService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private errorService = inject(ErrorService);

  ngOnInit(): void {
    this.loadContrats();
    this.loadUsers();
  }

  loadContrats(): void {
    this.loading = true;
    this.contratService.getAll().subscribe({
      next: (data) => {
        this.contrats = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des contrats', error);
        this.errorService.showError('Impossible de charger les contrats');
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      }
    });
  }

  onViewDetail(contrat: Contrat): void {
    if (!contrat.id) {
      this.errorService.showError('ID contrat manquant');
      return;
    }
    this.router.navigate(['/admin/contrats', contrat.id]);
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
            this.errorService.showError('Impossible de supprimer le contrat');
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
      case StatutContrat.Resilie:
        return 'danger';
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
    const user = this.users.find((item) => item.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }
}
