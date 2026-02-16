import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  DemandeService,
  AdminDemandeListItem,
  DemandeStatus,
} from '../../../core/services/demande.service';
import { VeloService } from '../../../core/services/velo.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    SelectModule,
    InputTextModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-demande.component.html',
  styleUrls: ['./admin-demande.component.scss'],
})
export class AdminDemandesComponent implements OnInit {
  demandes: AdminDemandeListItem[] = [];
  filteredDemandes: AdminDemandeListItem[] = [];
  loading = false;
  readonly DemandeStatus = DemandeStatus;

  statusFilter: DemandeStatus | 'all' = 'all';
  typeFilter: string | 'all' = 'all';
  searchTerm = '';

  statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation', value: DemandeStatus.Finalisation },
    { label: 'Valide', value: DemandeStatus.Valide },
    { label: 'Refuse', value: DemandeStatus.Refuse },
  ];
  typeOptions: Array<{ label: string; value: string | 'all' }> = [{ label: 'Tous', value: 'all' }];
  private typeOptionsLoaded = false;

  private demandeService = inject(DemandeService);
  private veloService = inject(VeloService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorService = inject(ErrorService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadTypeOptions();
    this.applyFilters();
  }

  loadDemandes(): void {
    this.loading = true;
    const status = this.statusFilter === 'all' ? null : this.statusFilter;
    const type = this.typeFilter === 'all' ? null : this.typeFilter;
    const search = this.searchTerm.trim();
    this.demandeService
      .getList({
        status: status ?? undefined,
        type: type ?? undefined,
        search: search ? search : undefined,
      })
      .subscribe({
        next: (data) => {
          this.demandes = data;
          this.filteredDemandes = data;
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

  onView(demande: AdminDemandeListItem): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/admin/demandes', demande.id]);
  }

  onEdit(demande: AdminDemandeListItem): void {
    if (!demande.id) {
      this.errorService.showError('ID demande manquant');
      return;
    }
    this.router.navigate(['/admin/demandes', demande.id, 'edit']);
  }

  onStatusChange(demande: AdminDemandeListItem, newStatus: DemandeStatus): void {
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

  onValidate(demande: AdminDemandeListItem): void {
    this.onStatusChange(demande, DemandeStatus.Valide);
  }

  onReject(demande: AdminDemandeListItem): void {
    this.onStatusChange(demande, DemandeStatus.Refuse);
  }

  onDelete(demande: AdminDemandeListItem): void {
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

  getStatusClass(status: DemandeStatus): string {
    return this.demandeService.getStatusClass(status);
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }

  applyFilters(): void {
    this.loadDemandes();
  }

  loadTypeOptions(): void {
    if (this.typeOptionsLoaded) {
      return;
    }
    this.veloService.getTypes().subscribe({
      next: (types) => {
        this.setTypeOptions(types);
        this.typeOptionsLoaded = true;
      },
      error: () => {
        this.errorService.showError('Impossible de charger les types de velo');
      },
    });
  }

  setTypeOptions(types: string[]): void {
    this.typeOptions = [
      { label: 'Tous', value: 'all' },
      ...types.map((value) => ({ label: value, value })),
    ];
  }

  formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  exportDemandes(): void {
    const status = this.statusFilter === 'all' ? null : this.statusFilter;
    const type = this.typeFilter === 'all' ? null : this.typeFilter;
    const search = this.searchTerm.trim();

    this.demandeService
      .exportCsv({
        status: status ?? undefined,
        type: type ?? undefined,
        search: search ? search : undefined,
      })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'demandes-export.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.errorService.showError("Impossible d'exporter les demandes");
        },
      });
  }
}
