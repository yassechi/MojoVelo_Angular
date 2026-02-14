import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../../core/services/user.service';
import { environment } from '../../../../../environments/environment';
import { ContratDetailStore } from './contrat-detail.store';

@Component({
  selector: 'app-contrat-detail-info',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './contrat-detail-info.component.html',
  styleUrls: ['./contrat-detail-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailInfoComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ContratDetailStore);
  private readonly coreApi = environment.urls.coreApi;

  readonly contrat = computed(() => this.store.contrat());

  readonly beneficiaireResource = httpResource<User | null>(
    () => {
      const contrat = this.contrat();
      return contrat ? `${this.coreApi}/User/get-one/${contrat.beneficiaireId}` : undefined;
    },
    { defaultValue: null },
  );
  readonly beneficiaire = computed(() => this.beneficiaireResource.value());

  readonly responsableRhResource = httpResource<User | null>(
    () => {
      const contrat = this.contrat();
      return contrat ? `${this.coreApi}/User/get-one/${contrat.userRhId}` : undefined;
    },
    { defaultValue: null },
  );
  readonly responsableRH = computed(() => this.responsableRhResource.value());

  onEditContrat(): void {
    const contrat = this.contrat();
    if (contrat?.id) {
      this.router.navigate(['/admin/contrats/edit', contrat.id]);
    }
  }

  formatDate(date?: string): string {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleDateString('fr-FR');
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
}
