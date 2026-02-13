import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContratService, Contrat, StatutContrat } from '../../../core/services/contrat.service';
import { User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-user-contrats',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user-contrats.component.html',
  styleUrls: ['./user-contrats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsComponent {
  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);

  private readonly contratApiUrl = `${environment.urls.coreApi}/Contrat`;
  private readonly userApiUrl = `${environment.urls.coreApi}/User`;

  readonly currentUser = toSignal(this.authService.currentUser, {
    initialValue: this.authService.getCurrentUser(),
  });
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  readonly contratsResource = httpResource<Contrat[]>(
    () => `${this.contratApiUrl}/get-all`,
    {
      defaultValue: [],
    },
  );

  readonly usersResource = httpResource<User[]>(
    () => `${this.userApiUrl}/get-all`,
    {
      defaultValue: [],
    },
  );

  readonly loading = computed(
    () => this.contratsResource.isLoading() || this.usersResource.isLoading(),
  );
  readonly users = computed(() => this.usersResource.value() ?? []);
  readonly userNameById = computed(() => {
    const map = new Map<string, string>();
    for (const user of this.users()) {
      if (user.id) {
        map.set(user.id, `${user.firstName} ${user.lastName}`.trim());
      }
    }
    return map;
  });
  readonly userContrats = computed(() => {
    const userId = this.currentUserId();
    if (!userId) {
      return [];
    }
    return (this.contratsResource.value() ?? []).filter(
      (contrat) => contrat.beneficiaireId === userId,
    );
  });

  private readonly contratsErrorShown = signal(false);
  private readonly contratsErrorEffect = effect(() => {
    const error = this.contratsResource.error();
    if (error && !this.contratsErrorShown()) {
      console.error('Erreur lors du chargement des contrats', error);
      this.errorService.showError('Impossible de charger les contrats');
      this.contratsErrorShown.set(true);
    }
    if (!error && this.contratsErrorShown()) {
      this.contratsErrorShown.set(false);
    }
  });

  private readonly usersErrorEffect = effect(() => {
    const error = this.usersResource.error();
    if (error) {
      console.error('Erreur lors du chargement des utilisateurs', error);
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

  getUserFullName(userId: string): string {
    return this.userNameById().get(userId) ?? userId;
  }
}
