import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ContratService,
  AdminContratListItem,
  StatutContrat,
} from '../../../core/services/contrat.service';
import { AuthService } from '../../../core/services/auth.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';
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
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './manager-contrats.component.html',
  styleUrls: ['./manager-contrats.component.scss'],
})
export class ContratsComponent implements OnInit {
  contrats: AdminContratListItem[] = [];
  loading = false;
  currentUserOrgId: number | null = null;

  private contratService = inject(ContratService);
  private authService = inject(AuthService);
  private messageService = inject(PrimeMessageService);
  private confirmationService = inject(ConfirmationService);
  private errorService = inject(ErrorService);

  ngOnInit(): void {
    this.loadCurrentUserOrg();
    this.loadContrats();
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

  loadContrats(): void {
    this.loading = true;
    if (!this.currentUserOrgId) {
      this.contrats = [];
      this.loading = false;
      return;
    }

    this.contratService.getList({ organisationId: this.currentUserOrgId }).subscribe({
      next: (data) => {
        this.contrats = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorService.showError('Impossible de charger les contrats');
        this.loading = false;
      },
    });
  }

  onDelete(contrat: AdminContratListItem): void {
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
}


