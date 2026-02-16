import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ContratService, ContratDetail, StatutContrat } from '../../../../core/services/contrat.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';

import { ContratDetailStore } from './contrat-detail.store';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ToastModule,
    TabsModule,
    RouterOutlet,
  ],
  providers: [PrimeMessageService, ContratDetailStore],
  templateUrl: './admin-contrat-detail.component.html',
  styleUrls: ['./admin-contrat-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly errorService = inject(ErrorService);
  private readonly contratStore = inject(ContratDetailStore);
  private readonly coreApi = environment.urls.coreApi;

  readonly contratId = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? Number(id) : null;
      }),
    ),
    { initialValue: null },
  );

  readonly contratResource = httpResource<ContratDetail | null>(
    () => {
      const id = this.contratId();
      return id ? `${this.coreApi}/Contrat/get-detail/${id}` : undefined;
    },
    { defaultValue: null },
  );
  readonly contrat = computed(() => this.contratResource.value());

  readonly loading = computed(() => this.contratResource.isLoading());

  readonly tabs = [
    { route: 'detail', label: 'Donn\u00e9es du contrat', icon: 'pi pi-id-card' },
    { route: 'documents', label: 'Documents', icon: 'pi pi-file-pdf' },
    { route: 'entretien', label: 'Entretien', icon: 'pi pi-wrench' },
    { route: 'amortissement', label: 'Amortissement', icon: 'pi pi-chart-line' },
  ];
  private getActiveTabPath(): string {
    return this.route.snapshot.firstChild?.routeConfig?.path ?? 'detail';
  }

  readonly activeTab = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.getActiveTabPath()),
      startWith(this.getActiveTabPath()),
    ),
    { initialValue: 'detail' },
  );

  private readonly contratErrorShown = signal(false);
  private readonly contratErrorEffect = effect(() => {
    const error = this.contratResource.error();
    if (error && !this.contratErrorShown()) {
      this.errorService.showError('Impossible de charger le contrat');
      this.contratErrorShown.set(true);
      this.router.navigate(['/admin/contrats']);
    }
    if (!error && this.contratErrorShown()) {
      this.contratErrorShown.set(false);
    }
  });

  private readonly contratStoreEffect = effect(() => {
    this.contratStore.setContrat(this.contrat());
  });

  goBack(): void {
    this.router.navigate(['/admin/contrats']);
  }

  onTabChange(value: string | number | undefined): void {
    if (!value || typeof value !== 'string') {
      return;
    }
    this.router.navigate([value], { relativeTo: this.route });
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Resilie:
        return 'danger';
      default:
        return 'secondary';
    }
  }
}


