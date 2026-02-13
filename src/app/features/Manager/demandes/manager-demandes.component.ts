import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ErrorService } from '../../../core/services/error.service';

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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manager-demandes.component.html',
  styleUrls: ['./manager-demandes.component.scss'],
})
export class DemandesComponent implements OnInit {
  demandes: Demande[] = [];
  loading = false;
  currentUserOrgId: number | null = null;

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'En attente', value: DemandeStatus.Attente },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Valide', value: DemandeStatus.Valide },
  ];

  private readonly demandeService = inject(DemandeService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
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

    // First, load users in the organization.
    this.userService.getAll().subscribe({
      next: (users) => {
        const orgUserIds = users
          .filter((u) => {
            const orgId =
              typeof u.organisationId === 'object' ? u.organisationId.id : u.organisationId;
            return orgId === this.currentUserOrgId;
          })
          .map((u) => u.id!);

        // Then load demandes and filter by userId.
        this.demandeService.getAll().subscribe({
          next: (data) => {
            this.demandes = data.filter((d) => orgUserIds.includes(d.idUser));
            this.loading = false;
          },
          error: () => {
            this.errorService.showError('Impossible de charger les demandes');
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
        this.errorService.showError('Impossible de charger les utilisateurs');
      },
    });
  }

  onCreate(): void {
    this.router.navigate(['/manager/demandes/new']);
  }

  onView(demande: Demande): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/manager/demandes', demande.id]);
  }

  onEdit(demande: Demande): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/manager/demandes', demande.id, 'edit']);
  }

  onStatusChange(demande: Demande, newStatus: DemandeStatus): void {
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

  onDelete(demande: Demande): void {
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
