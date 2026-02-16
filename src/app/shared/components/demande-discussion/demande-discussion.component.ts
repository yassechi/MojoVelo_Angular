import {
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, interval, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { DemandeDetail, DemandeMessage, DemandeService } from '../../../core/services/demande.service';
import { ErrorService } from '../../../core/services/error.service';
import { AuthService } from '../../../core/services/auth.service';
import { DiscussionMessage, MessageApiService } from '../../../core/services/message.service';

@Component({
  selector: 'app-demande-discussion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  templateUrl: './demande-discussion.component.html',
  styleUrls: ['./demande-discussion.component.scss'],
})
export class DemandeDiscussionComponent implements OnInit, OnChanges {
  @Input() demandeId: number | null = null;

  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  messages: DemandeMessage[] = [];
  loadingMessages = false;
  sendingMessage = false;
  messageText = '';

  private discussionId: number | null = null;
  private demandeUserId: string | null = null;

  private readonly demandeService = inject(DemandeService);
  private readonly errorService = inject(ErrorService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.startDiscussionRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['demandeId']) {
      if (this.demandeId) {
        this.refreshMessages(true);
      } else {
        this.messages = [];
        this.discussionId = null;
        this.demandeUserId = null;
      }
    }
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
          this.applyDemandeDetail(demande);
        },
        error: () => {
          // Rafraichissement silencieux pour eviter le spam
        },
      });
  }

  private refreshMessages(showLoader: boolean): void {
    if (!this.demandeId) {
      return;
    }
    if (showLoader) {
      this.loadingMessages = true;
    }
    this.demandeService.getDetail(this.demandeId).subscribe({
      next: (demande) => {
        this.applyDemandeDetail(demande);
        if (showLoader) {
          this.loadingMessages = false;
        }
      },
      error: () => {
        if (showLoader) {
          this.loadingMessages = false;
          this.errorService.showError('Impossible de charger les messages');
        }
      },
    });
  }

  private applyDemandeDetail(demande: DemandeDetail): void {
    this.discussionId = demande.discussionId ?? null;
    this.demandeUserId = demande.idUser ?? null;
    this.messages = demande.messages ?? [];
    this.scheduleScrollToBottom();
  }

  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content) {
      return;
    }
    if (!this.discussionId) {
      this.errorService.showError('Aucune discussion disponible');
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
      discussionId: this.discussionId,
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
        this.refreshMessages(false);
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
    const messageUserId = this.normalizeId(message.userId);
    const demandeUserId = this.normalizeId(this.demandeUserId ?? undefined);

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

  private scheduleScrollToBottom(): void {
    setTimeout(() => this.scrollToBottom());
  }

  private scrollToBottom(): void {
    const element = this.messageList?.nativeElement;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }
}
