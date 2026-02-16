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
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-utilisateur-demandes',
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
  templateUrl: './utilisateur-demandes.component.html',
  styleUrls: ['./utilisateur-demandes.component.scss'],
})
export class DemandesUtilisateurComponent implements OnInit {
  demandes: AdminDemandeListItem[] = [];
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
    if (!this.currentUserId) {
      this.demandes = [];
      this.loading = false;
      return;
    }

    this.demandeService.getList({ userId: this.currentUserId }).subscribe({
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
    this.router.navigate(['/user/demandes/new']);
  }

  onView(demande: AdminDemandeListItem): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/user/demandes', demande.id]);
  }

  onEdit(demande: AdminDemandeListItem): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/user/demandes', demande.id, 'edit']);
  }

  onDelete(demande: AdminDemandeListItem): void {
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
    return this.demandeService.getStatusSeverity(status);
  }

  getStatusClass(status: DemandeStatus): string {
    return this.demandeService.getStatusClass(status);
  }
}
