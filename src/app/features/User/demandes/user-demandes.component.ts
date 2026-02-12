import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { UserDemandeFormDialogComponent } from './user-demande-form-dialog/user-demande-form-dialog';
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
  selector: 'app-user-demandes',
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
    UserDemandeFormDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-demandes.component.html',
  styleUrls: ['./user-demandes.component.scss'],
})
export class DemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;
  dialogVisible = false;
  selectedDemande: Demande | null = null;
  currentUserId: string | null = null;

  constructor(
    private demandeService: DemandeService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserId();
    this.loadDemandes();
  }

  loadCurrentUserId(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id || null;
    }
  }

  loadDemandes(): void {
    this.loading = true;
    this.demandeService.getAll().subscribe({
      next: (data) => {
        // ✅ Filtrer uniquement les demandes de l'utilisateur connecté
        if (this.currentUserId) {
          this.demandes = data.filter(d => d.idUser === this.currentUserId);
        } else {
          this.demandes = [];
        }
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
