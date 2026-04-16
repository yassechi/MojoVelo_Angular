import { Contrat, ContratService } from '../../../../core/services/contrat.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header';
import { EmptyTableComponent } from '../../../../shared/empty-table/empty-table';
import { ContratStatutTagComponent } from '../../../../shared/contrat-statut-tag/contrat-statut-tag';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manager-contrats',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, TagModule, PageHeaderComponent, EmptyTableComponent, ContratStatutTagComponent],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
})
export class ManagerContratsComponent {
  contrats = signal<Contrat[]>([]);
  loading = signal(false);

  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  private readonly orgId: number | null = (() => {
    const user = this.authService.getCurrentUser();
    if (!user?.organisationId) return null;
    return typeof user.organisationId === 'object'
      ? (user.organisationId as any).id
      : user.organisationId;
  })();

  constructor() {
    if (!this.orgId) {
      this.contrats.set([]);
      return;
    }
    this.loading.set(true);
    this.contratService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => {
        this.contrats.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.showError(this.i18n.get('contrats.loadError'));
        this.loading.set(false);
      },
    });
  }

  onViewDetail(contrat: Contrat): void {
    if (!contrat.id) {
      this.messageService.showError(this.i18n.get('contrats.invalid'));
      return;
    }
    this.router.navigate(['/manager/contrats', contrat.id]);
  }

  load(): void {
    if (!this.orgId) {
      this.contrats.set([]);
      return;
    }
    this.loading.set(true);
    this.contratService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => {
        this.contrats.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.showError(this.i18n.get('contrats.loadError'));
        this.loading.set(false);
      },
    });
  }

  formatDate(date: string): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Date(date).toLocaleDateString(locale);
  }
  formatCurrency(amount: number): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
