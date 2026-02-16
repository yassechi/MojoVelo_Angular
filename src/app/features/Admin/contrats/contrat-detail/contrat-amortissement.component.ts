import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin, of, switchMap, finalize, timeout, catchError, map } from 'rxjs';
import { Amortissement, AmortissementService } from '../../../../core/services/amortissement.service';
import { MoisAmortissement, MoisAmortissementService } from '../../../../core/services/mois-amortissement.service';
import { ErrorService } from '../../../../core/services/error.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import { ContratDetailStore } from './contrat-detail.store';

@Component({
  selector: 'app-contrat-amortissement',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, DividerModule, InputTextModule],
  templateUrl: './contrat-amortissement.component.html',
  styleUrls: ['./contrat-amortissement.component.scss'],
})
export class ContratAmortissementComponent implements OnInit {
  private readonly amortissementService = inject(AmortissementService);
  private readonly moisAmortissementService = inject(MoisAmortissementService);
  private readonly messageService = inject(MessageService);
  private readonly errorService = inject(ErrorService);
  private readonly store = inject(ContratDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly coreApi = environment.urls.coreApi;

  readonly veloId = computed(() => this.store.veloId());
  readonly routeContratId = toSignal(
    (this.route.parent ?? this.route).paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? Number(id) : null;
      }),
    ),
    { initialValue: null },
  );
  readonly contratId = computed(() => this.routeContratId() ?? this.store.contratId());

  readonly amortissementsResource = httpResource<Amortissement[]>(
    () => {
      const veloId = this.veloId();
      return veloId ? `${this.coreApi}/Amortissement/get-by-velo/${veloId}` : undefined;
    },
    { defaultValue: [] },
  );
  readonly amortissements = computed(() => this.amortissementsResource.value() ?? []);
  readonly displayAmortissement = computed(
    () => this.currentAmortissement ?? this.amortissements()[0] ?? null,
  );

  editingAmortissement = false;
  currentAmortissement: Amortissement | null = null;
  editingMonths: MoisAmortissement[] = [];
  loadingMonths = false;
  savingMonths = false;
  private lastLoadedContratId: number | null = null;

  private readonly amortissementsErrorEffect = effect(() => {
    const error = this.amortissementsResource.error();
    if (error && !this.isUnauthorized(error)) {
      this.errorService.showError('Impossible de charger les amortissements');
    }
  });

  private readonly setCurrentAmortissementEffect = effect(() => {
    const first = this.amortissements()[0];
    if (!this.currentAmortissement && first) {
      this.currentAmortissement = first;
    }
  });

  private readonly loadMonthsEffect = effect(() => {
    const contratId = this.contratId();
    if (!contratId || this.loadingMonths) {
      return;
    }

    if (this.lastLoadedContratId === contratId && this.editingMonths.length > 0) {
      return;
    }

    this.lastLoadedContratId = contratId;
    this.loadMonthsByContrat(contratId);
  });

  ngOnInit(): void {
    const snapshotId =
      this.route.parent?.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('id');
    if (snapshotId) {
      this.loadMonthsByContrat(Number(snapshotId));
    }
  }

  private isUnauthorized(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const err = error as { status?: number; cause?: { status?: number } };
    const status = err.status ?? err.cause?.status;
    return status === 401 || status === 403;
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

  onEditAmortissement(amort: Amortissement): void {
    this.editingAmortissement = true;
    this.currentAmortissement = amort;
    const contratId = this.contratId();
    if (contratId) {
      this.loadMonthsByContrat(contratId);
    }
  }

  onCancelEditAmortissement(): void {
    const contratId = this.contratId();
    if (contratId) {
      this.loadMonthsByContrat(contratId);
      return;
    }

    this.editingAmortissement = false;
    this.currentAmortissement = null;
    this.editingMonths = [];
    this.loadingMonths = false;
    this.savingMonths = false;
    this.lastLoadedContratId = null;
  }

  onSaveAmortissement(): void {
    if (!this.currentAmortissement || this.editingMonths.length === 0) {
      return;
    }

    const updatedMonths: MoisAmortissement[] = this.editingMonths.map((month) => ({
      ...month,
      montant: this.normalizeAmount(month.montant),
    }));

    const totalAmortissement = updatedMonths.reduce((sum, item) => sum + (item.montant || 0), 0);
    const newValeurResiduelle = Math.max(
      0,
      this.currentAmortissement.valeurInit - totalAmortissement,
    );

    const updatedAmort: Amortissement = {
      ...this.currentAmortissement,
      valeurResiduelleFinale: newValeurResiduelle,
      dureeMois: updatedMonths.length || this.currentAmortissement.dureeMois,
    };

    const monthRequests = updatedMonths.map((item) =>
      item.id ? this.moisAmortissementService.update(item) : this.moisAmortissementService.create(item),
    );

    this.savingMonths = true;
    forkJoin(monthRequests.length ? monthRequests : [of(null)])
      .pipe(
        switchMap(() => this.amortissementService.update(updatedAmort)),
        finalize(() => (this.savingMonths = false)),
      )
      .subscribe({
        next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succ\u00e8s',
          detail: "Amortissement mis \u00e0 jour",
        });
          this.editingAmortissement = false;
          this.lastLoadedContratId = null;
          this.amortissementsResource.reload();
        },
        error: () => {
          this.errorService.showError("Impossible de mettre \u00e0 jour l'amortissement");
        },
      });
  }

  getTotalAmortissement(): number {
    return this.editingMonths.reduce(
      (sum, month) => sum + this.normalizeAmount(month.montant),
      0,
    );
  }

  private loadMonthsByContrat(contratId: number): void {
    this.loadingMonths = true;
    this.moisAmortissementService
      .getByContrat(contratId)
      .pipe(
        timeout(8000),
        catchError(() => {
          this.errorService.showError("Impossible de charger les mois d'amortissement");
          return of([]);
        }),
        finalize(() => (this.loadingMonths = false)),
      )
      .subscribe({
        next: (months) => {
          const sorted = [...months].sort((a, b) => a.numeroMois - b.numeroMois);
          this.editingMonths = sorted;
          this.editingAmortissement = true;
        },
        error: () => {
          this.errorService.showError("Impossible de charger les mois d'amortissement");
        },
      });
  }

  private normalizeAmount(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
