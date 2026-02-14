import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, map, of } from 'rxjs';
import { Demande, DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { ErrorService } from '../../../core/services/error.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserService } from '../../../core/services/user.service';
import { DiscussionMessage, MessageApiService } from '../../../core/services/message.service';
import { Velo, VeloService } from '../../../core/services/velo.service';
import { Discussion, DiscussionService } from '../../../core/services/discussion.service';
import {
  BikeCatalogService,
  BikeItem,
  BikeBrand,
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
    SelectModule,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './admin-demande-detail.component.html',
  styleUrls: ['./admin-demande-detail.component.scss'],
})
export class DemandeDetailComponent implements OnInit {
  private readonly demandeService = inject(DemandeService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly bikeCatalogService = inject(BikeCatalogService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly veloService = inject(VeloService);
  private readonly discussionService = inject(DiscussionService);

  demande: Demande | null = null;
  demandeId: number | null = null;
  user: User | null = null;
  bike: BikeItem | null = null;
  velo: Velo | null = null;
  discussion: Discussion | null = null;
  brand: BikeBrand | null = null;
  brands: BikeBrand[] = [];
  bikes: BikeItem[] = [];
  loading = false;
  loadingMessages = false;
  sendingMessage = false;
  messages: DiscussionMessage[] = [];
  messageText = '';
  private readonly userRoleMap = new Map<string, number>();

  decisionOptions = [
    { label: 'Finaliser', value: DemandeStatus.Finalisation },
    { label: 'Valider', value: DemandeStatus.Valide },
    { label: 'Refuser', value: DemandeStatus.Refuse },
  ];
  readonly DemandeStatus = DemandeStatus;
  selectedDecision: DemandeStatus | null = null;
  comment = '';

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      this.userRoleMap.set(this.normalizeId(currentUser.id), currentUser.role);
    }
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.goBack();
        return;
      }
      this.demandeId = Number(id);
      this.loadDemande(this.demandeId);
      this.loadCatalog();
    });
  }

  loadDemande(id: number): void {
    this.loading = true;
    this.demandeService.getOne(id).subscribe({
      next: (demande) => {
        this.demande = demande;
        this.loadUser(demande.idUser);
        this.loadVelo(demande.idVelo);
        this.setBikeFromCatalog();
        this.loadDiscussion(demande.discussionId);
        this.loadMessages(demande.discussionId);
        this.selectedDecision = null;
        this.loading = false;
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading = false;
        this.goBack();
      },
    });
  }

  loadUser(userId: string): void {
    this.userService.getOne(userId).subscribe({
      next: (user) => {
        this.user = user;
      },
    });
  }

  loadCatalog(): void {
    this.bikeCatalogService.getBikes(100, 1, true).subscribe({
      next: (data) => {
        this.bikes = data.items;
        this.setBikeFromCatalog();
        this.setBikeFromVelo();
      },
    });

    this.bikeCatalogService.getBrands().subscribe({
      next: (data) => {
        this.brands = data.items;
        this.updateBrand();
      },
    });
  }

  setBike(bike: BikeItem | null): void {
    this.bike = bike;
    this.updateBrand();
  }

  setBikeFromCatalog(): void {
    if (!this.demande || this.bikes.length === 0) {
      return;
    }
    this.setBike(this.bikes.find((item) => item.id === this.demande?.idVelo) ?? null);
  }

  updateBrand(): void {
    const brandId = this.bike?.bikes_brand?.[0];
    if (!brandId) {
      this.brand = null;
      return;
    }
    this.brand = this.brands.find((item) => item.id === brandId) ?? null;
  }

  loadVelo(id: number): void {
    this.veloService.getOne(id).subscribe({
      next: (velo) => {
        this.velo = velo;
        this.setBikeFromVelo();
      },
    });
  }

  loadDiscussion(discussionId?: number): void {
    if (!discussionId) {
      this.discussion = null;
      return;
    }
    this.discussionService.getOne(discussionId).subscribe({
      next: (discussion) => {
        this.discussion = discussion;
      },
    });
  }

  private setBikeFromVelo(): void {
    const numeroSerie = this.velo?.numeroSerie ?? '';
    if (!numeroSerie.startsWith('CMS-')) {
      return;
    }
    const id = Number(numeroSerie.replace('CMS-', ''));
    if (!Number.isFinite(id) || this.bikes.length === 0) {
      return;
    }
    this.setBike(this.bikes.find((item) => item.id === id) ?? null);
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

  getActifLabel(demande: Demande): string {
    if (demande.isActif === undefined || demande.isActif === null) {
      return '-';
    }
    return demande.isActif ? 'Oui' : 'Non';
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

  loadMessages(discussionId?: number): void {
    if (!discussionId) {
      this.messages = [];
      return;
    }
    this.loadingMessages = true;
    this.messageApiService.getByDiscussion(discussionId).subscribe({
      next: (messages) => {
        this.messages = [...messages].sort((a, b) => {
          const dateA = new Date(a.dateEnvoi ?? a.createdDate ?? '').getTime();
          const dateB = new Date(b.dateEnvoi ?? b.createdDate ?? '').getTime();
          return dateA - dateB;
        });
        this.loadMessageAuthors(this.messages);
        this.loadingMessages = false;
      },
      error: () => {
        this.loadingMessages = false;
        this.errorService.showError('Impossible de charger les messages');
      },
    });
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
        this.loadMessages(this.demande?.discussionId);
      },
      error: () => {
        this.sendingMessage = false;
        this.errorService.showError('Impossible d\'envoyer le message');
      },
    });
  }

  private loadMessageAuthors(messages: DiscussionMessage[]): void {
    const ids = new Set<string>();
    messages.forEach((message) => {
      const id = this.normalizeId(message.userId) || this.normalizeId(message.createdBy);
      if (id && !this.userRoleMap.has(id)) {
        ids.add(id);
      }
    });

    if (ids.size === 0) {
      return;
    }

    const requests = Array.from(ids).map((id) =>
      this.userService.getOne(id).pipe(
        map((user) => ({ id, user })),
        catchError(() => of({ id, user: null as User | null })),
      ),
    );

    forkJoin(requests).subscribe((results) => {
      results.forEach((result) => {
        if (result.user?.id) {
          this.userRoleMap.set(this.normalizeId(result.user.id), result.user.role);
        }
      });
    });
  }

  isOwnMessage(message: DiscussionMessage): boolean {
    const currentUser = this.authService.getCurrentUser();
    const currentId = this.normalizeId(currentUser?.id);
    const demandeUserId = this.normalizeId(this.demande?.idUser);
    const messageUserId = this.normalizeId(message.userId) || this.normalizeId(message.createdBy);

    if (currentId) {
      return messageUserId === currentId;
    }
    if (demandeUserId) {
      return messageUserId === demandeUserId;
    }
    return false;
  }

  getMessageRole(message: DiscussionMessage): string {
    const messageUserId = this.normalizeId(message.userId) || this.normalizeId(message.createdBy);
    const currentUser = this.authService.getCurrentUser();
    const currentId = this.normalizeId(currentUser?.id);

    if (messageUserId) {
      const role = this.userRoleMap.get(messageUserId);
      if (role !== undefined) {
        return this.getRoleLabel(role);
      }
    }

    if (currentId && messageUserId === currentId) {
      return this.getRoleLabel(currentUser?.role);
    }

    if (this.discussion) {
      const clientId = this.normalizeId(this.discussion.clientId);
      const mojoId = this.normalizeId(this.discussion.mojoId);
      if (clientId && messageUserId === clientId) {
        return 'Client';
      }
      if (mojoId && messageUserId === mojoId) {
        return 'Mojo';
      }
    }

    return 'Utilisateur';
  }

  private getRoleLabel(role?: number): string {
    switch (role) {
      case 1:
        return 'Mojo';
      case 2:
        return 'Manager';
      case 3:
        return 'Client';
      default:
        return 'Utilisateur';
    }
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

  formatCurrency(amount?: number): string {
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
