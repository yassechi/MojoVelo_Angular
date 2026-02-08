import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { DemandeFormDialogComponent } from '../../Admin/demandes/demande-form-dialog/demande-form-dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service'; // ✅ AJOUTÉ

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
    DemandeFormDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './demandes.component.html',
  styleUrls: ['./demandes.component.scss'],
})
export class DemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;
  dialogVisible = false;
  selectedDemande: Demande | null = null;
  currentUserOrgId: number | null = null;

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'En attente', value: DemandeStatus.Attente },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Validé', value: DemandeStatus.Valide },
  ];

  constructor(
    private demandeService: DemandeService,
    private userService: UserService, // ✅ AJOUTÉ
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserOrg();
    this.loadDemandes();
  }

  loadCurrentUserOrg(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (user.organisationId) {
      this.currentUserOrgId =
        typeof user.organisationId === 'object'
          ? (user.organisationId as any).id
          : user.organisationId;
    }
  }
  
  loadDemandes(): void {
    this.loading = true;

    // D'abord, charger les users de l'organisation
    this.userService.getAll().subscribe({
      next: (users) => {
        const orgUserIds = users
          .filter((u) => {
            const orgId =
              typeof u.organisationId === 'object' ? u.organisationId.id : u.organisationId;
            return orgId === this.currentUserOrgId;
          })
          .map((u) => u.id!); // ✅ AJOUTÉ '!' car id peut être undefined

        // Ensuite, charger toutes les demandes et filtrer par userId
        this.demandeService.getAll().subscribe({
          next: (data) => {
            this.demandes = data.filter((d) => orgUserIds.includes(d.idUser));
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
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les utilisateurs',
        });
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
