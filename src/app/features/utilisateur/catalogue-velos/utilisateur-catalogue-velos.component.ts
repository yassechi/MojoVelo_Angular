import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BikeCatalogService, BikeBrand, BikeItem } from '../../../core/services/bike-catalog.service';
import { ErrorService } from '../../../core/services/error.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreateDemandeWithBikePayload, DemandeService } from '../../../core/services/demande.service';
import { finalize } from 'rxjs';

interface CatalogueBike {
  id: number;
  title: string;
  brand: string;
  type: string;
  assistance: string;
  genre: string;
  price: number | null;
  imageUrl: string | null;
}

@Component({
  selector: 'app-utilisateur-catalogue-velos',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule, CardModule],
  templateUrl: './utilisateur-catalogue-velos.component.html',
  styleUrls: ['./utilisateur-catalogue-velos.component.scss'],
})
export class CatalogueVelosUtilisateurComponent implements OnInit {
  organisationName = '';
  organisationLogoUrl: string | null = null;
  loading = false;

  bikes: CatalogueBike[] = [];
  selectedBikeId: number | null = null;
  creatingDemande = false;
  currentPage = 1;
  readonly pageSize = 12;

  selectedBrand: string | null = null;
  selectedType: string | null = null;
  selectedAssistance: string | null = null;
  selectedGenre: string | null = null;

  brandOptions: Array<{ label: string; value: string }> = [];
  typeOptions: Array<{ label: string; value: string }> = [];
  assistanceOptions: Array<{ label: string; value: string }> = [];
  genreOptions: Array<{ label: string; value: string }> = [];

  private brandMap = new Map<number, BikeBrand>();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bikeCatalogService = inject(BikeCatalogService);
  private readonly errorService = inject(ErrorService);
  private readonly authService = inject(AuthService);
  private readonly demandeService = inject(DemandeService);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.organisationName = params['organisationName'] || '';
      this.organisationLogoUrl = params['organisationLogoUrl'] || null;
    });
    this.loadBikes();
  }

  get filteredBikes(): CatalogueBike[] {
    return this.bikes.filter((bike) => {
      const matchesBrand = !this.selectedBrand || bike.brand === this.selectedBrand;
      const matchesType = !this.selectedType || bike.type === this.selectedType;
      const matchesAssistance =
        !this.selectedAssistance || bike.assistance === this.selectedAssistance;
      const matchesGenre = !this.selectedGenre || bike.genre === this.selectedGenre;
      return matchesBrand && matchesType && matchesAssistance && matchesGenre;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBikes.length / this.pageSize));
  }

  get pagedBikes(): CatalogueBike[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBikes.slice(start, start + this.pageSize);
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  confirmSelection(bike: CatalogueBike): void {
    this.selectedBikeId = bike.id;
    if (!this.authService.isAuthenticated()) {
      this.errorService.showError('Veuillez vous connecter pour creer une demande');
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorService.showError('Utilisateur non authentifie');
      return;
    }

    const payload: CreateDemandeWithBikePayload = {
      idUser: currentUser.id,
      bike: {
        cmsId: bike.id,
        marque: bike.brand || 'Marque inconnue',
        modele: bike.title || 'Modele inconnu',
        type: bike.type || null,
        prixAchat: bike.price ?? 0,
      },
    };

    this.creatingDemande = true;
    this.demandeService
      .createWithBike(payload)
      .pipe(
        finalize(() => {
          this.creatingDemande = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const demandeId = response.demandeId ?? response.id ?? null;
          const queryParams: Record<string, string> = {
            bikeTitle: bike.title || '',
          };
          if (bike.price !== null && bike.price !== undefined) {
            queryParams['bikePrice'] = String(bike.price);
          }
          if (demandeId !== null) {
            queryParams['demandeId'] = String(demandeId);
          }
          this.router.navigate(['/demande-confirmation'], { queryParams });
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            (error instanceof Error && error.message
              ? error.message
              : 'Impossible de creer la demande');
          this.errorService.showError(message);
        },
      });
  }

  isSelected(bike: CatalogueBike): boolean {
    return this.selectedBikeId === bike.id;
  }

  formatCurrency(amount?: number | null): string {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private loadBikes(): void {
    this.loading = true;
    this.bikeCatalogService.getBrands(100).subscribe({
      next: (brandsResponse) => {
        this.brandMap = new Map(brandsResponse.items.map((brand) => [brand.id, brand]));
        this.loadBikesFromCms();
      },
      error: () => {
        this.brandMap.clear();
        this.loadBikesFromCms();
      },
    });
  }

  private loadBikesFromCms(): void {
    this.bikeCatalogService.getBikes(100, 1, true).subscribe({
      next: (bikesResponse) => {
        this.bikes = bikesResponse.items.map((bike) => this.mapBike(bike));
        this.buildOptions();
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.bikes = [];
        this.buildOptions();
        this.errorService.showError('Impossible de charger le catalogue velos');
      },
    });
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

  private mapBike(bike: BikeItem): CatalogueBike {
    return {
      id: bike.id,
      title: bike.title?.rendered ?? `#${bike.id}`,
      brand: this.getBrandName(bike.bikes_brand?.[0]),
      type: bike.acf?.type ?? 'Type inconnu',
      assistance: bike.acf?.assistance ?? 'Assistance inconnue',
      genre: bike.acf?.genre ?? 'Genre inconnu',
      price: bike.acf?.prix ?? bike.acf?.prix_par_mois ?? null,
      imageUrl: this.getBikeImage(bike),
    };
  }

  private buildOptions(): void {
    const brandSet = new Set<string>();
    const typeSet = new Set<string>();
    const assistanceSet = new Set<string>();
    const genreSet = new Set<string>();

    this.bikes.forEach((bike) => {
      if (bike.brand && bike.brand !== 'Marque inconnue') {
        brandSet.add(bike.brand);
      }
      if (bike.type) {
        typeSet.add(bike.type);
      }
      if (bike.assistance) {
        assistanceSet.add(bike.assistance);
      }
      if (bike.genre) {
        genreSet.add(bike.genre);
      }
    });

    this.brandOptions = Array.from(brandSet)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
    this.typeOptions = Array.from(typeSet)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
    this.assistanceOptions = Array.from(assistanceSet)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
    this.genreOptions = Array.from(genreSet)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
  }

  private getBrandName(brandId?: number): string {
    if (!brandId) {
      return 'Marque inconnue';
    }
    return this.brandMap.get(brandId)?.name ?? 'Marque inconnue';
  }

  private getBikeImage(bike: BikeItem): string | null {
    const embedded = bike._embedded?.['wp:featuredmedia']?.[0];
    return embedded?.source_url ?? null;
  }
}
