import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Contrat, ContratService } from '../../../../core/services/contrat.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header';
import { EmptyTableComponent } from '../../../../shared/empty-table/empty-table';
import { ContratStatutTagComponent } from '../../../../shared/contrat-statut-tag/contrat-statut-tag';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-user-contrats',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    PageHeaderComponent,
    EmptyTableComponent,
    ContratStatutTagComponent,
  ],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsUtilisateurComponent {
  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  readonly i18n = inject(I18nService);

  readonly currentUser = this.authService.currentUser;
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  readonly loading = signal(false);
  readonly userContrats = signal<Contrat[]>([]);

  private readonly contratsErrorShown = signal(false);
  private readonly contratsEffect = effect((onCleanup) => {
    const userId = this.currentUserId();
    if (!userId) {
      this.userContrats.set([]);
      this.loading.set(false);
      this.contratsErrorShown.set(false);
      return;
    }

    this.loading.set(true);
    const sub = this.contratService.getList({ userId }).subscribe({
      next: (data) => {
        this.userContrats.set(data ?? []);
        this.loading.set(false);
        this.contratsErrorShown.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.contratsErrorShown()) {
          this.messageService.showError(this.i18n.get('contrats.loadError'));
          this.contratsErrorShown.set(true);
        }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  formatDate(date: string): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Date(date).toLocaleDateString(locale);
  }
  formatCurrency(amount: number): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
