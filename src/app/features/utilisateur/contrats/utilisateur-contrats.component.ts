import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ContratService,
  AdminContratListItem,
  StatutContrat,
} from '../../../core/services/contrat.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-utilisateur-contrats',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [PrimeMessageService],
  templateUrl: './utilisateur-contrats.component.html',
  styleUrls: ['./utilisateur-contrats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsUtilisateurComponent {
  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);

  private readonly contratApiUrl = `${environment.urls.coreApi}/Contrat`;

  readonly currentUser = toSignal(this.authService.currentUser, {
    initialValue: this.authService.getCurrentUser(),
  });
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  readonly contratsResource = httpResource<AdminContratListItem[]>(
    () => {
      const userId = this.currentUserId();
      return userId ? `${this.contratApiUrl}/list?userId=${encodeURIComponent(userId)}` : undefined;
    },
    {
      defaultValue: [],
    },
  );

  readonly loading = computed(
    () => this.contratsResource.isLoading(),
  );
  readonly userContrats = computed(() => {
    return this.contratsResource.value() ?? [];
  });

  private readonly contratsErrorShown = signal(false);
  private readonly contratsErrorEffect = effect(() => {
    const error = this.contratsResource.error();
    if (error && !this.contratsErrorShown()) {
      this.errorService.showError('Impossible de charger les contrats');
      this.contratsErrorShown.set(true);
    }
    if (!error && this.contratsErrorShown()) {
      this.contratsErrorShown.set(false);
    }
  });

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
}


