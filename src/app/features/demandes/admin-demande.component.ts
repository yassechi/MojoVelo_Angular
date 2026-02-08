import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeService, Demande, DemandeStatus } from '../../core/services/demande.service';
import { DemandeFormDialogComponent } from './demande-form-dialog/demande-form-dialog';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demandes',
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
    DemandeFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-demande.component.html',
  styleUrls: ['./admin-demande.component.scss'],
})
export class AdminDemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;
  dialogVisible = false;
  selectedDemande: Demande | null = null;

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'En attente', value: DemandeStatus.Attente },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Validé', value: DemandeStatus.Valide },
  ];

  constructor(
    private demandeService: DemandeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

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
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les demandes',
        });
        this.loading = false;
      },
    });
  }

  openDialog(demande?: Demande): void {
    this.selectedDemande = demande || null;
    this.dialogVisible = true;
  }

  onDialogSave(): void {
    this.loadDemandes();
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
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de mettre à jour le statut',
        });
      },
    });
  }

  onDelete(demande: Demande): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer cette demande ?`,
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
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de supprimer la demande',
            });
          },
        });
      },
    });
  }

  getStatusLabel(status: DemandeStatus): string {
    return this.demandeService.getStatusLabel(status);
  }

  getStatusSeverity(status: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case DemandeStatus.Encours:
        return 'info';
      case DemandeStatus.Attente:
        return 'warn';
      case DemandeStatus.AttenteComagnie:
        return 'warn';
      case DemandeStatus.Valide:
        return 'success';
      default:
        return 'secondary';
    }
  }
}
