import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';
import { InterventionService, Intervention } from '../../../core/services/intervention.service';
import { BikeCatalogService, BikeItem, BikeBrand } from '../../../core/services/bike-catalog.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService, User } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-contrats',
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
    ProgressBarModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-contrats.component.html',
  styleUrls: ['./admin-contrats.component.scss'],
})
export class AdminContratsComponent implements OnInit {
  contrats: Contrat[] = [];
  filteredContrats: Contrat[] = [];
  loading = false;
  users: User[] = [];
  bikes: BikeItem[] = [];
  brands: BikeBrand[] = [];
  interventions: Intervention[] = [];

  typeFilter: string | 'all' = 'all';
  endFilter: 'all' | 'soon' = 'all';
  incidentFilter: 'all' | 'with' = 'all';
  searchTerm = '';

  typeOptions: Array<{ label: string; value: string | 'all' }> = [{ label: 'Tous', value: 'all' }];
  endOptions = [
    { label: 'Tous', value: 'all' },
    { label: '< 3 mois', value: 'soon' },
  ];
  incidentOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Avec incidents', value: 'with' },
  ];

  private contratService = inject(ContratService);
  private userService = inject(UserService);
  private interventionService = inject(InterventionService);
  private bikeCatalogService = inject(BikeCatalogService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private errorService = inject(ErrorService);

  ngOnInit(): void {
    this.loadContrats();
    this.loadUsers();
    this.loadCatalog();
    this.loadInterventions();
  }

  loadContrats(): void {
    this.loading = true;
    this.contratService.getAll().subscribe({
      next: (data) => {
        this.contrats = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des contrats', error);
        this.errorService.showError('Impossible de charger les contrats');
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
      },
    });
  }

  loadCatalog(): void {
    this.bikeCatalogService.getBikes().subscribe({
      next: (data) => {
        this.bikes = data.items;
        this.updateTypeOptions();
        this.applyFilters();
      },
    });

    this.bikeCatalogService.getBrands().subscribe({
      next: (data) => {
        this.brands = data.items;
      },
    });
  }

  loadInterventions(): void {
    this.interventionService.getAll().subscribe({
      next: (data) => {
        this.interventions = data;
        this.applyFilters();
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredContrats = this.contrats.filter((contrat) => {
      if (this.typeFilter !== 'all') {
        const bikeType = this.getBikeType(contrat.veloId);
        if (!bikeType || bikeType.toLowerCase() !== this.typeFilter.toLowerCase()) {
          return false;
        }
      }
      if (this.endFilter === 'soon' && !this.isEndingSoon(contrat.dateFin)) {
        return false;
      }
      if (this.incidentFilter === 'with' && this.getIncidentsCount(contrat.veloId) === 0) {
        return false;
      }
      if (!term) {
        return true;
      }
      const userName = this.getUserFullName(contrat.beneficiaireId).toLowerCase();
      const bikeTitle = this.getBikeTitle(contrat.veloId).toLowerCase();
      return userName.includes(term) || bikeTitle.includes(term);
    });
  }

  updateTypeOptions(): void {
    const types = new Set(
      this.bikes.map((bike) => bike.acf?.type).filter((value): value is string => Boolean(value)),
    );
    this.typeOptions = [{ label: 'Tous', value: 'all' }, ...Array.from(types).map((value) => ({
      label: value,
      value,
    }))];
  }

  onViewDetail(contrat: Contrat): void {
    if (!contrat.id) {
      this.errorService.showError('ID contrat manquant');
      return;
    }
    this.router.navigate(['/admin/contrats', contrat.id]);
  }

  onTerminate(contrat: Contrat): void {
    this.confirmationService.confirm({
      message: `Resilier le contrat ${contrat.ref} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.contratService.update({ ...contrat, statutContrat: StatutContrat.Resilie }).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succes',
              detail: 'Contrat resilie',
            });
            this.loadContrats();
          },
          error: () => {
            this.errorService.showError('Impossible de resilier le contrat');
          },
        });
      },
    });
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Termine:
        return 'secondary';
      case StatutContrat.Resilie:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  getUserFullName(userId: string): string {
    const user = this.users.find((item) => item.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }

  getBikeById(veloId: number): BikeItem | undefined {
    return this.bikes.find((bike) => bike.id === veloId);
  }

  getBikeTitle(veloId: number): string {
    const bike = this.getBikeById(veloId);
    return bike?.title?.rendered ?? `#${veloId}`;
  }

  getBikeType(veloId: number): string {
    const bike = this.getBikeById(veloId);
    return bike?.acf?.type ?? '';
  }

  getBikeBrand(veloId: number): string {
    const bike = this.getBikeById(veloId);
    const brandId = bike?.bikes_brand?.[0];
    if (!brandId) {
      return '';
    }
    const brand = this.brands.find((item) => item.id === brandId);
    return brand?.name ?? '';
  }

  getIncidentsCount(veloId: number): number {
    return this.interventions.filter((item) => item.veloId === veloId && item.isActif).length;
  }

  getMaintenanceBudget(veloId: number): number {
    const bikePrice = this.getBikeById(veloId)?.acf?.prix ?? 0;
    return Math.max(300, Math.round(bikePrice * 0.05));
  }

  getMaintenanceUsed(veloId: number): number {
    return this.interventions
      .filter((item) => item.veloId === veloId && item.isActif)
      .reduce((sum, item) => sum + (item.cout || 0), 0);
  }

  getMaintenanceProgress(veloId: number): number {
    const budget = this.getMaintenanceBudget(veloId);
    const used = this.getMaintenanceUsed(veloId);
    if (!budget) {
      return 0;
    }
    return Math.min(100, Math.round((used / budget) * 100));
  }

  isEndingSoon(dateFin: string): boolean {
    const end = new Date(dateFin).getTime();
    const now = new Date().getTime();
    const diffDays = (end - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 90;
  }

  exportContrats(): void {
    const headers = ['Reference', 'Employe', 'Velo', 'Debut', 'Fin', 'Statut'];
    const rows = this.filteredContrats.map((contrat) => [
      contrat.ref,
      this.getUserFullName(contrat.beneficiaireId),
      this.getBikeTitle(contrat.veloId),
      this.formatDate(contrat.dateDebut),
      this.formatDate(contrat.dateFin),
      this.getStatutLabel(contrat.statutContrat),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contrats-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
