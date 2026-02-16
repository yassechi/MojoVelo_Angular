import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';
import { Organisation, OrganisationService } from '../../../core/services/organisation.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-compagnies',
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
    InputTextModule,
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './admin-compagnies.component.html',
  styleUrls: ['./admin-compagnies.component.scss'],
})
export class AdminCompagniesComponent implements OnInit {
  filteredOrganisations: Organisation[] = [];
  loading = false;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Actif', value: 'active' },
    { label: 'Inactif', value: 'inactive' },
  ];

  private readonly organisationService = inject(OrganisationService);
  private readonly primeMessageService = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.applyFilters();
  }

  loadOrganisations(): void {
    const isActif = this.statusFilter === 'all' ? undefined : this.statusFilter === 'active';
    const search = this.searchTerm.trim() || undefined;
    this.loading = true;
    
    this.organisationService
      .getList({ isActif, search })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.filteredOrganisations = data;
        },
        error: () => {
          this.errorService.showError('Impossible de charger les organisations');
        },
      });
  }

  applyFilters(): void {
    this.loadOrganisations();
  }

  onCreate(): void {
    this.router.navigate(['/admin/compagnies/new']);
  }

  onView(organisation: Organisation): void {
    this.router.navigate(['/admin/compagnies', organisation.id]);
  }

  onEdit(organisation: Organisation): void {
    this.router.navigate(['/admin/compagnies', organisation.id, 'edit']);
  }

  onDelete(organisation: Organisation): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer "${organisation.name}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.organisationService.delete(organisation.id).subscribe({
          next: () => {
            this.primeMessageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Compagnie supprimée',
            });
            this.loadOrganisations();
          },
          error: (error) => {
            this.errorService.showError('Impossible de supprimer la compagnie');
          },
        });
      },
    });
  }
}
