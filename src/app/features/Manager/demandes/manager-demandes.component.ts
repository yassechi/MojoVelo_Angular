import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  DemandeService,
  AdminDemandeListItem,
  DemandeStatus,
} from '../../../core/services/demande.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manager-demandes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectModule,
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './manager-demandes.component.html',
  styleUrls: ['./manager-demandes.component.scss'],
})
export class DemandesComponent implements OnInit {
  demandes: AdminDemandeListItem[] = [];
  loading = false;
  currentUserOrgId: number | null = null;

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation', value: DemandeStatus.Finalisation },
    { label: 'Valide', value: DemandeStatus.Valide },
    { label: 'Refuse', value: DemandeStatus.Refuse },
  ];

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadCurrentUserOrg();
    this.loadDemandes();
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

  loadDemandes(): void {
    this.loading = true;
    if (!this.currentUserOrgId) {
      this.demandes = [];
      this.loading = false;
      return;
    }

    this.demandeService.getList({ organisationId: this.currentUserOrgId }).subscribe({
      next: (data) => {
        this.demandes = data;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger les demandes');
        this.loading = false;
      },
    });
  }

  onCreate(): void {
    this.router.navigate(['/manager/demandes/new']);
  }

  onView(demande: AdminDemandeListItem): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/manager/demandes', demande.id]);
  }

  onEdit(demande: AdminDemandeListItem): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/manager/demandes', demande.id, 'edit']);
  }

  onStatusChange(demande: AdminDemandeListItem, newStatus: DemandeStatus): void {
    this.demandeService.updateStatus(demande.id!, newStatus).subscribe({
      next: () => {
        demande.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail: 'Statut mis a jour',
        });
      },
      error: () => {
        this.errorService.showError('Impossible de mettre a jour le statut');
      },
    });
  }

  onDelete(demande: AdminDemandeListItem): void {
    this.confirmationService.confirm({
      message: 'Etes-vous sur de vouloir supprimer cette demande ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.demandeService.delete(demande.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Demande supprimee',
            });
            this.loadDemandes();
          },
          error: () => {
            this.errorService.showError('Impossible de supprimer la demande');
          },
        });
      },
    });
  }

  getStatusLabel(status: DemandeStatus): string {
    return this.demandeService.getStatusLabel(status);
  }

  getStatusSeverity(status: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }

  getStatusClass(status: DemandeStatus): string {
    return this.demandeService.getStatusClass(status);
  }
}


