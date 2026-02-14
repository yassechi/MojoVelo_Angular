import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { Amortissement, AmortissementService } from '../../../../core/services/amortissement.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratAmortissementComponent {
  private readonly amortissementService = inject(AmortissementService);
  private readonly messageService = inject(MessageService);
  private readonly errorService = inject(ErrorService);
  private readonly store = inject(ContratDetailStore);
  private readonly coreApi = environment.urls.coreApi;

  readonly veloId = computed(() => this.store.veloId());

  readonly amortissementsResource = httpResource<Amortissement[]>(
    () => `${this.coreApi}/Amortissement/get-all`,
    { defaultValue: [] },
  );
  readonly amortissements = computed(() => {
    if (!this.amortissementsResource.hasValue()) {
      return [];
    }
    const veloId = this.veloId();
    if (!veloId) {
      return [];
    }
    return (this.amortissementsResource.value() ?? []).filter(
      (amortissement) => amortissement.veloId === veloId && amortissement.isActif,
    );
  });

  editingAmortissement = false;
  amortissementValues: number[] = [];
  currentAmortissement: Amortissement | null = null;

  private readonly amortissementsErrorEffect = effect(() => {
    const error = this.amortissementsResource.error();
    if (error && !this.isUnauthorized(error)) {
      this.errorService.showError('Impossible de charger les amortissements');
    }
  });

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
    const monthlyValue = (amort.valeurInit - amort.valeurResiduelleFinale) / amort.dureeMois;
    this.amortissementValues = Array(amort.dureeMois).fill(monthlyValue);
  }

  onCancelEditAmortissement(): void {
    this.editingAmortissement = false;
    this.currentAmortissement = null;
    this.amortissementValues = [];
  }

  onSaveAmortissement(): void {
    if (!this.currentAmortissement) {
      return;
    }

    const totalAmortissement = this.amortissementValues.reduce((sum, val) => sum + val, 0);
    const newValeurResiduelle = this.currentAmortissement.valeurInit - totalAmortissement;

    const updatedAmort: Amortissement = {
      ...this.currentAmortissement,
      valeurResiduelleFinale: newValeurResiduelle,
    };

    this.amortissementService.update(updatedAmort).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succ\u00e8s',
          detail: 'Amortissement mis \u00e0 jour',
        });
        this.editingAmortissement = false;
        this.amortissementsResource.reload();
      },
      error: () => {
        this.errorService.showError("Impossible de mettre \u00e0 jour l'amortissement");
      },
    });
  }

  getTotalAmortissement(): number {
    return this.amortissementValues.reduce((sum, val) => sum + (val || 0), 0);
  }
}
