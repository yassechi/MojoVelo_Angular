import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, interval, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  DemandeDetail,
  DemandeMessage,
  DemandeService,
  DemandeStatus,
} from '../../../core/services/demande.service';
import { ErrorService } from '../../../core/services/error.service';
import { AuthService } from '../../../core/services/auth.service';
import { DiscussionMessage, MessageApiService } from '../../../core/services/message.service';
import {
  BikeCatalogService,
  BikeItem,
} from '../../../core/services/bike-catalog.service';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TextareaModule,
    ToastModule,
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
  private readonly messageApiService = inject(MessageApiService);
  private readonly destroyRef = inject(DestroyRef);

  demande: DemandeDetail | null = null;
  demandeId: number | null = null;
  bike: BikeItem | null = null;
  loading = false;
  loadingMessages = false;
  sendingMessage = false;
  messages: DemandeMessage[] = [];
  messageText = '';

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

    this.startDiscussionRefresh();
  }

  private startDiscussionRefresh(): void {
    interval(4000)
      .pipe(
        filter(() => !!this.demandeId),
        switchMap(() => this.demandeService.getDetail(this.demandeId!)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (demande) => {
          this.messages = demande.messages ?? [];
          if (this.demande) {
            this.demande = { ...this.demande, status: demande.status, messages: this.messages };
          } else {
            this.demande = demande;
          }
        },
        error: () => {
          // Rafraichissement silencieux: pas de toast pour eviter le spam
        },
      });
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.loadingMessages = true;
    this.demandeService.getDetail(id).subscribe({
      next: (demande) => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 3) {
          const currentId = this.normalizeId(currentUser.id);
          const demandeUserId = this.normalizeId(demande.idUser);
          if (!currentId || !demandeUserId || currentId !== demandeUserId) {
            this.loading = false;
            this.loadingMessages = false;
            this.demande = null;
            this.messages = [];
            this.errorService.showError(
              'Vous ne pouvez pas acceder a la demande d\'un autre utilisateur',
            );
            this.goBack();
            return;
          }
        }
        this.demande = demande;
        this.messages = demande.messages ?? [];
        this.loading = false;
        this.loadingMessages = false;
        this.loadBikeImage(demande.veloCmsId ?? null);
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading = false;
        this.loadingMessages = false;
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

  sendMessage(): void {
    if (!this.demande?.discussionId) {
      this.errorService.showError('Aucune discussion disponible');
      return;
    }
    const content = this.messageText.trim();
    if (!content) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorService.showError('Utilisateur non authentifie');
      return;
    }

    this.sendingMessage = true;
    const now = new Date().toISOString();
    const payload: DiscussionMessage = {
      id: 0,
      createdDate: now,
      modifiedDate: now,
      createdBy: currentUser.id,
      modifiedBy: currentUser.id,
      isActif: true,
      contenu: content,
      dateEnvoi: now,
      userId: currentUser.id,
      discussionId: this.demande.discussionId,
    };

    this.messageApiService.create(payload).subscribe({
      next: () => {
        this.messageText = '';
        this.sendingMessage = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Message envoyé',
        });
        if (this.demandeId) {
          this.loadDemande(this.demandeId);
        }
      },
      error: () => {
        this.sendingMessage = false;
        this.errorService.showError('Impossible d\'envoyer le message');
      },
    });
  }

  isOwnMessage(message: DemandeMessage): boolean {
    const currentUser = this.authService.getCurrentUser();
    const currentId = this.normalizeId(currentUser?.id);
    const demandeUserId = this.normalizeId(this.demande?.idUser);
    const messageUserId = this.normalizeId(message.userId);

    if (currentId) {
      return messageUserId === currentId;
    }
    if (demandeUserId) {
      return messageUserId === demandeUserId;
    }
    return false;
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


