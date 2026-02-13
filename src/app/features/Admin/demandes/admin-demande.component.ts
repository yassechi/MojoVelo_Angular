import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-demande.component.html',
  styleUrls: ['./admin-demande.component.scss'],
})
export class AdminDemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;

  private demandeService = inject(DemandeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorService = inject(ErrorService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    this.demandeService.getAll().subscribe({
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
    this.router.navigate(['/admin/demandes/new']);
  }

  onView(demande: Demande): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/admin/demandes', demande.id]);
  }

  onEdit(demande: Demande): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/admin/demandes', demande.id, 'edit']);
  }

  onStatusChange(demande: Demande, newStatus: DemandeStatus): void {
    this.demandeService.updateStatus(demande.id!, newStatus).subscribe({
      next: () => {
        demande.status = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Statut mis à jour',
        });
      },
      error: () => {
        this.errorService.showError('Impossible de mettre à jour le statut');
      },
    });
  }

  onDelete(demande: Demande): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer cette demande ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.demandeService.delete(demande.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Demande supprimée',
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

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }
}
