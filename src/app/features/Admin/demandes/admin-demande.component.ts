import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DemandeService, Demande, DemandeStatus } from '../../../core/services/demande.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';
import { UserService, User } from '../../../core/services/user.service';
import { Organisation, OrganisationService } from '../../../core/services/organisation.service';
import {
  BikeCatalogService,
  BikeItem,
  BikeBrand,
} from '../../../core/services/bike-catalog.service';
import { Velo, VeloService } from '../../../core/services/velo.service';

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
  demandes: Demande[] = [];
  filteredDemandes: Demande[] = [];
  users: User[] = [];
  organisations: Organisation[] = [];
  bikes: BikeItem[] = [];
  brands: BikeBrand[] = [];
  velos: Velo[] = [];
  totalBikes = 0;
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

  private demandeService = inject(DemandeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorService = inject(ErrorService);
  private userService = inject(UserService);
  private organisationService = inject(OrganisationService);
  private bikeCatalogService = inject(BikeCatalogService);
  private veloService = inject(VeloService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadDemandes();
    this.loadUsers();
    this.loadCatalog();
    this.loadVelos();
    this.loadOrganisations();
  }

  loadDemandes(): void {
    this.loading = true;
    this.demandeService.getAll().subscribe({
      next: (data) => {
        this.demandes = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger les demandes');
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
      error: () => {
        this.errorService.showError('Impossible de charger les utilisateurs');
      },
    });
  }

  loadOrganisations(): void {
    this.organisationService.getAll().subscribe({
      next: (data) => {
        this.organisations = data;
      },
      error: () => {
        this.errorService.showError('Impossible de charger les compagnies');
      },
    });
  }

  loadCatalog(): void {
    this.bikeCatalogService.getBikes().subscribe({
      next: (data) => {
        this.bikes = data.items;
        this.totalBikes = data.total;
        this.updateTypeOptions();
        this.applyFilters();
      },
      error: () => {
        this.errorService.showError('Impossible de charger le catalogue velos');
      },
    });

    this.bikeCatalogService.getBrands().subscribe({
      next: (data) => {
        this.brands = data.items;
      },
      error: () => {
        this.errorService.showError('Impossible de charger les marques velos');
      },
    });
  }

  loadVelos(): void {
    this.veloService.getAll().subscribe({
      next: (data) => {
        this.velos = data;
        this.applyFilters();
      },
      error: () => {
        this.errorService.showError('Impossible de charger les velos');
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

  onValidate(demande: Demande): void {
    this.onStatusChange(demande, DemandeStatus.Valide);
  }

  onReject(demande: Demande): void {
    this.onStatusChange(demande, DemandeStatus.Refuse);
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

  getStatusClass(status: DemandeStatus): string {
    return this.demandeService.getStatusClass(status);
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDemandes = this.demandes.filter((demande) => {
      if (this.statusFilter !== 'all' && demande.status !== this.statusFilter) {
        return false;
      }
      if (this.typeFilter !== 'all') {
        const bikeType = this.getBikeType(demande.idVelo);
        if (!bikeType || bikeType.toLowerCase() !== this.typeFilter.toLowerCase()) {
          return false;
        }
      }
      if (!term) {
        return true;
      }
      const userName = this.getUserFullName(demande.idUser).toLowerCase();
      const bikeTitle = this.getBikeTitle(demande.idVelo).toLowerCase();
      return userName.includes(term) || bikeTitle.includes(term);
    });
  }

  updateTypeOptions(): void {
    const types = new Set(
      this.bikes
        .map((bike) => bike.acf?.type)
        .filter((value): value is string => Boolean(value)),
    );
    this.typeOptions = [{ label: 'Tous', value: 'all' }, ...Array.from(types).map((value) => ({
      label: value,
      value,
    }))];
  }

  getUserFullName(userId: string): string {
    const user = this.users.find((item) => item.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }

  getBikeById(veloId: number): BikeItem | undefined {
    const direct = this.bikes.find((bike) => bike.id === veloId);
    if (direct) {
      return direct;
    }
    const velo = this.getVeloById(veloId);
    const cmsId = this.getCmsIdFromVelo(velo);
    if (!cmsId) {
      return undefined;
    }
    return this.bikes.find((bike) => bike.id === cmsId);
  }

  getVeloById(veloId: number): Velo | undefined {
    return this.velos.find((velo) => velo.id === veloId);
  }

  private getCmsIdFromVelo(velo?: Velo): number | null {
    const numeroSerie = velo?.numeroSerie ?? '';
    if (!numeroSerie.startsWith('CMS-')) {
      return null;
    }
    const id = Number(numeroSerie.replace('CMS-', ''));
    return Number.isFinite(id) ? id : null;
  }

  getBikeTitle(veloId: number): string {
    const bike = this.getBikeById(veloId);
    if (bike?.title?.rendered) {
      return bike.title.rendered;
    }
    const velo = this.getVeloById(veloId);
    return velo?.modele ?? `#${veloId}`;
  }

  getBikeType(veloId: number): string {
    const bike = this.getBikeById(veloId);
    return bike?.acf?.type ?? '';
  }

  getUserOrganisationName(userId: string): string {
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      return '';
    }
    const orgId =
      typeof user.organisationId === 'object' ? user.organisationId.id : user.organisationId;
    const organisation = this.organisations.find((item) => item.id === orgId);
    return organisation?.name ?? '';
  }

  getBikeTypeOrCompany(veloId: number, userId: string): string {
    return this.getBikeType(veloId) || this.getUserOrganisationName(userId);
  }

  getBikePrice(veloId: number): number | null {
    const bike = this.getBikeById(veloId);
    if (bike?.acf?.prix !== undefined) {
      return bike.acf.prix ?? null;
    }
    const velo = this.getVeloById(veloId);
    return velo?.prixAchat ?? null;
  }

  getBikeBrand(veloId: number): string {
    const bike = this.getBikeById(veloId);
    const brandId = bike?.bikes_brand?.[0];
    if (!brandId) {
      const velo = this.getVeloById(veloId);
      return velo?.marque ?? '';
    }
    const brand = this.brands.find((item) => item.id === brandId);
    return brand?.name ?? '';
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
    const headers = ['ID', 'Employe', 'Velo', 'Type', 'Prix', 'Statut'];
    const rows = this.filteredDemandes.map((demande) => [
      String(demande.id ?? ''),
      this.getUserFullName(demande.idUser),
      this.getBikeTitle(demande.idVelo),
      this.getBikeType(demande.idVelo),
      this.formatCurrency(this.getBikePrice(demande.idVelo)),
      this.getStatusLabel(demande.status),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'demandes-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
