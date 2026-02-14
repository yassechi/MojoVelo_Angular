import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { finalize, map, switchMap, throwError } from 'rxjs';
import { Demande, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BikeCatalogService, BikeBrand, BikeItem } from '../../../../core/services/bike-catalog.service';
import { Velo, VeloService } from '../../../../core/services/velo.service';
import { Discussion, DiscussionService } from '../../../../core/services/discussion.service';
import { DiscussionMessage, MessageApiService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-user-demande-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumber,
    ToastModule,
  ],
  templateUrl: './user-demande-form-dialog.html',
  styleUrls: ['./user-demande-form-dialog.scss'],
})
export class UserDemandeFormDialogComponent implements OnInit {
  loading = false;

  private readonly fb = inject(FormBuilder);
  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bikeCatalogService = inject(BikeCatalogService);
  private readonly veloService = inject(VeloService);
  private readonly discussionService = inject(DiscussionService);
  private readonly messageApiService = inject(MessageApiService);

  private readonly mojoId = 'c5e095fa-2ce3-4e18-8d23-e66c6be1818c';

  form = this.fb.group({
    idVelo: this.fb.control<number | null>(null, Validators.required),
  });

  demande: Demande | null = null;
  demandeId: number | null = null;
  isEdit = false;
  loadingBikes = false;
  searchTerm = '';
  bikes: BikeItem[] = [];
  private brandMap = new Map<number, BikeBrand>();
  selectedBrandId: number | null = null;
  selectedType: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  currentPage = 1;
  readonly pageSize = 8;

  ngOnInit(): void {
    this.loadBikes();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.demandeId = Number(id);
        this.loadDemandeById(this.demandeId);
      } else {
        this.isEdit = false;
        this.demandeId = null;
        this.demande = null;
        this.form.reset({
          idVelo: null,
        });
      }
    });
  }

  get selectedBikeId(): number | null {
    return this.form.get('idVelo')?.value ?? null;
  }

  get selectedBike(): BikeItem | undefined {
    const selectedId = this.selectedBikeId;
    return this.bikes.find((bike) => bike.id === selectedId);
  }

  get filteredBikes(): BikeItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    const brandId = this.selectedBrandId;
    const typeFilter = this.selectedType?.toLowerCase() ?? '';
    const minPrice = this.minPrice ?? null;
    const maxPrice = this.maxPrice ?? null;

    return this.bikes.filter((bike) => {
      const title = bike.title?.rendered?.toLowerCase() ?? '';
      const type = bike.acf?.type?.toLowerCase() ?? '';
      const brand = this.getBrandName(bike.bikes_brand?.[0]).toLowerCase();
      const price = bike.acf?.prix ?? null;

      const matchesSearch = !term || title.includes(term) || type.includes(term) || brand.includes(term);
      const matchesBrand = !brandId || bike.bikes_brand?.includes(brandId);
      const matchesType = !typeFilter || type.includes(typeFilter);
      const matchesMin = minPrice === null || (price !== null && price >= minPrice);
      const matchesMax = maxPrice === null || (price !== null && price <= maxPrice);

      return matchesSearch && matchesBrand && matchesType && matchesMin && matchesMax;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBikes.length / this.pageSize));
  }

  get pagedBikes(): BikeItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBikes.slice(start, start + this.pageSize);
  }

  private loadBikes(): void {
    this.loadingBikes = true;
    this.bikeCatalogService.getBrands(100).subscribe({
      next: (brandsResponse) => {
        this.brandMap = new Map(brandsResponse.items.map((brand) => [brand.id, brand]));
      },
      error: () => {
        this.errorService.showError('Impossible de charger les marques');
      },
    });

    this.bikeCatalogService.getBikes(100, 1, true).subscribe({
      next: (bikesResponse) => {
        this.bikes = bikesResponse.items;
        this.loadingBikes = false;
        this.currentPage = 1;
      },
      error: () => {
        this.loadingBikes = false;
        this.errorService.showError('Impossible de charger les velos');
      },
    });
  }

  getBrandName(brandId?: number): string {
    if (!brandId) {
      return 'Marque inconnue';
    }
    return this.brandMap.get(brandId)?.name ?? 'Marque inconnue';
  }

  get brandOptions(): Array<{ label: string; value: number }> {
    return Array.from(this.brandMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((brand) => ({ label: brand.name, value: brand.id }));
  }

  get typeOptions(): Array<{ label: string; value: string }> {
    const types = Array.from(
      new Set(
        this.bikes
          .map((bike) => bike.acf?.type)
          .filter((value): value is string => !!value),
      ),
    );
    return types.sort().map((type) => ({ label: type, value: type }));
  }

  getBikeImage(bike: BikeItem): string | null {
    const embedded = bike._embedded?.['wp:featuredmedia']?.[0];
    return embedded?.source_url ?? null;
  }

  formatCurrency(amount?: number): string {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  selectBike(bike: BikeItem): void {
    if (this.selectedBikeId === bike.id) {
      return;
    }
    this.form.patchValue({ idVelo: bike.id });
    this.messageService.add({
      severity: 'info',
      summary: 'Velo selectionne',
      detail: bike.title?.rendered ?? 'Velo selectionne',
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }
  private loadDemandeById(id: number): void {
    this.loading = true;
    this.demandeService.getOne(id).subscribe({
      next: (demande) => {
        this.demande = demande;
        this.form.patchValue({
          idVelo: demande.idVelo,
        });
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading = false;
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorService.showError('Utilisateur non authentifie');
      return;
    }

    const selectedBike = this.selectedBike;
    if (!selectedBike) {
      this.errorService.showError('Veuillez selectionner un velo');
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    if (this.isEdit) {
      const payload: Demande = {
        id: this.demandeId ?? this.demande?.id,
        idUser: currentUser.id,
        idVelo: Number(values.idVelo),
        status: this.demande?.status ?? DemandeStatus.Encours,
        discussionId: this.demande?.discussionId,
      };

      this.demandeService.update(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succes',
            detail: 'Demande modifiee',
          });
          this.loading = false;
          this.goBack();
        },
        error: () => {
          this.loading = false;
          this.errorService.showError('Impossible de modifier la demande');
        },
      });
      return;
    }

    const now = new Date().toISOString();
    const veloPayload: Velo = {
      id: 0,
      createdDate: now,
      modifiedDate: now,
      createdBy: currentUser.id,
      modifiedBy: currentUser.id,
      isActif: true,
      numeroSerie: `CMS-${selectedBike.id}`,
      marque: this.getBrandName(selectedBike.bikes_brand?.[0]),
      modele: selectedBike.title?.rendered ?? 'Modele inconnu',
      prixAchat: selectedBike.acf?.prix ?? 0,
      status: true,
    };

    this.veloService
      .create(veloPayload)
      .pipe(
        map((response) => this.extractId(response, 'velo')),
        switchMap((veloId) => {
          if (!veloId) {
            return throwError(() => new Error('ID velo manquant'));
          }

          const discussionPayload: Discussion = {
            id: 0,
            createdDate: now,
            modifiedDate: now,
            createdBy: currentUser.id,
            modifiedBy: currentUser.id,
            isActif: true,
            objet: `Demande velo - ${selectedBike.title?.rendered ?? 'Velo'}`,
            status: true,
            dateCreation: now,
            clientId: currentUser.id,
            mojoId: this.mojoId,
          };

          return this.discussionService.create(discussionPayload).pipe(
            map((response) => ({
              veloId,
              discussionId: this.extractId(response, 'discussion'),
            })),
          );
        }),
        switchMap(({ veloId, discussionId }) => {
          if (!discussionId) {
            return throwError(() => new Error('ID discussion manquant'));
          }

          const messagePayload: DiscussionMessage = {
            id: 0,
            createdDate: now,
            modifiedDate: now,
            createdBy: this.mojoId,
            modifiedBy: this.mojoId,
            isActif: true,
            contenu: `Bienvenue On va parler du velo "${selectedBike.title?.rendered ?? 'Velo'}"`,
            dateEnvoi: now,
            userId: this.mojoId,
            discussionId,
          };

          return this.messageApiService.create(messagePayload).pipe(
            map(() => ({
              veloId,
              discussionId,
            })),
          );
        }),
        switchMap(({ veloId, discussionId }) => {
          const payload: Demande = {
            id: this.demandeId ?? this.demande?.id,
            idUser: currentUser.id,
            idVelo: veloId,
            status: DemandeStatus.Encours,
            discussionId,
          };
          return this.demandeService.create(payload);
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succes',
            detail: 'Demande creee',
          });
          this.goBack();
        },
        error: (error) => {
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'Impossible de creer la demande';
          this.errorService.showError(message);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/user/demandes']);
  }

  private extractId(response: unknown, label: string): number | null {
    if (response === null || response === undefined) {
      return null;
    }
    if (typeof response === 'number') {
      return response;
    }
    if (typeof response === 'string') {
      const parsed = Number(response);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof response === 'object') {
      const data = response as Record<string, unknown>;
      const directId = data['id'] ?? data[`${label}Id`];
      if (typeof directId === 'number') {
        return directId;
      }
      const nested = (data['data'] ?? data['result'] ?? data['value']) as Record<string, unknown> | undefined;
      const nestedId = nested?.['id'];
      if (typeof nestedId === 'number') {
        return nestedId;
      }
      if (typeof nestedId === 'string') {
        const parsed = Number(nestedId);
        return Number.isFinite(parsed) ? parsed : null;
      }
    }
    return null;
  }
}
