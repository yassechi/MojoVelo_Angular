import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';

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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-demandes.component.html',
  styleUrls: ['./user-demandes.component.scss'],
})
export class DemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;
  currentUserId: string | null = null;

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

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
        this.errorService.showError('Impossible de charger les demandes');
        this.loading = false;
      },
    });
  }

  onCreate(): void {
    this.router.navigate(['/user/demandes/new']);
  }

  onView(demande: Demande): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/user/demandes', demande.id]);
  }

  onEdit(demande: Demande): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/user/demandes', demande.id, 'edit']);
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
