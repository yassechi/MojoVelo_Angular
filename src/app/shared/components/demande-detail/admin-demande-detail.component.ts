import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  DemandeDetail,
  DemandeService,
  DemandeStatus,
} from '../../../core/services/demande.service';
import { ErrorService } from '../../../core/services/error.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  BikeCatalogService,
  BikeItem,
} from '../../../core/services/bike-catalog.service';
import { DemandeDiscussionComponent } from '../demande-discussion/demande-discussion.component';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DemandeDiscussionComponent,
  ],
  providers: [PrimeMessageService],
  templateUrl: './admin-demande-detail.component.html',
  styleUrls: ['./admin-demande-detail.component.scss'],
})
export class DemandeDetailComponent implements OnInit {
  private readonly demandeService = inject(DemandeService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bikeCatalogService = inject(BikeCatalogService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly authService = inject(AuthService);

  demande: DemandeDetail | null = null;
  demandeId: number | null = null;
  bike: BikeItem | null = null;
  loading = false;

  readonly DemandeStatus = DemandeStatus;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.goBack();
        return;
      }
      this.demandeId = Number(id);
      this.loadDemande(this.demandeId);
    });
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.demandeService.getDetail(id).subscribe({
      next: (demande) => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 3) {
          const currentId = this.normalizeId(currentUser.id);
          const demandeUserId = this.normalizeId(demande.idUser);
          if (!currentId || !demandeUserId || currentId !== demandeUserId) {
            this.loading = false;
            this.demande = null;
            this.errorService.showError(
              'Vous ne pouvez pas acceder a la demande d\'un autre utilisateur',
            );
            this.goBack();
            return;
          }
        }
        this.demande = demande;
        this.loading = false;
        this.loadBikeImage(demande.veloCmsId ?? null);
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading = false;
        this.goBack();
      },
    });
  }

  private loadBikeImage(cmsId: number | null): void {
    if (!cmsId) {
      this.bike = null;
      return;
    }
    this.bikeCatalogService.getBikeById(cmsId, true).subscribe({
      next: (bike) => {
        this.bike = bike;
      },
      error: () => {
        this.bike = null;
      },
    });
  }

  getBikeImage(bike: BikeItem | null): string | null {
    if (!bike) {
      return null;
    }
    const embedded = bike._embedded?.['wp:featuredmedia']?.[0];
    return embedded?.source_url ?? null;
  }

  getStatusLabel(status: DemandeStatus): string {
    return this.demandeService.getStatusLabel(status);
  }

  getStatusClass(status: DemandeStatus): string {
    return this.demandeService.getStatusClass(status);
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }

  onDecision(decision: DemandeStatus): void {
    if (!this.demande?.id) {
      return;
    }

    this.demandeService.updateStatus(this.demande.id, decision).subscribe({
      next: () => {
        if (this.demande) {
          this.demande.status = decision;
        }
        const detail =
          decision === DemandeStatus.Finalisation
            ? 'Demande en finalisation'
            : decision === DemandeStatus.Valide
              ? 'Demande validee'
              : decision === DemandeStatus.AttenteComagnie
                ? 'Demande en attente compagnie'
                : 'Demande refusee';
        this.messageService.add({
          severity: 'success',
          summary: 'Succes',
          detail,
        });
      },
      error: () => {
        this.errorService.showError('Impossible de mettre a jour la demande');
      },
    });
  }

  onValidate(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 3) {
      this.onDecision(DemandeStatus.AttenteComagnie);
      return;
    }
    if (currentUser?.role === 2) {
      this.onDecision(DemandeStatus.Finalisation);
      return;
    }
    this.onDecision(DemandeStatus.Valide);
  }

  isValidateDisabled(): boolean {
    if (!this.demande) {
      return true;
    }
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 3) {
      return this.demande.status !== DemandeStatus.Encours;
    }
    if (currentUser?.role === 2) {
      return this.demande.status !== DemandeStatus.AttenteComagnie;
    }
    return this.demande.status !== DemandeStatus.Finalisation;
  }

  private normalizeId(value?: string): string {
    return (value ?? '').trim().replace(/[{}]/g, '').toLowerCase();
  }

  goBack(): void {
    this.router.navigate([this.getBasePath()]);
  }

  goEdit(): void {
    if (!this.demandeId) {
      return;
    }
    this.router.navigate([`${this.getBasePath()}/${this.demandeId}/edit`]);
  }

  formatCurrency(amount?: number | null): string {
    if (amount === undefined || amount === null) {
      return '-';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  get isUserView(): boolean {
    return this.router.url.startsWith('/user/');
  }

  private getBasePath(): string {
    const url = this.router.url;
    if (url.startsWith('/manager/')) {
      return '/manager/demandes';
    }
    if (url.startsWith('/user/')) {
      return '/user/demandes';
    }
    return '/admin/demandes';
  }
}


