import { Component, DestroyRef, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, filter, interval, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DemandeMessage, DemandeService } from '../../../core/services/demande.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessageApiService } from '../../../core/services/message.service';

@Component({
  selector: 'app-demande-discussion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  templateUrl: './demande-discussion.component.html',
  styleUrls: ['./demande-discussion.component.scss'],
})
export class DemandeDiscussionComponent implements OnInit {
  @Input() demandeId: number | null = null;
  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  messages: DemandeMessage[] = [];
  messageText = '';

  private discussionId: number | null = null;

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.demandeId) {
      this.demandeService.getDetail(this.demandeId).subscribe(demande => this.chargerMessages(demande));
    }

    interval(4000)
      .pipe(
        filter(() => !!this.demandeId),
        switchMap(() => this.demandeService.getDetail(this.demandeId!).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(demande => this.chargerMessages(demande));
  }

  private chargerMessages(demande: any): void {
    this.discussionId = demande.discussionId ?? null;
    this.messages = demande.messages ?? [];
    setTimeout(() => {
      const el = this.messageList?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || !this.discussionId) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    const now = new Date().toISOString();

    this.messageApiService.create({
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
    }).subscribe(() => {
      this.messageText = '';
      this.demandeService.getDetail(this.demandeId!).subscribe(demande => this.chargerMessages(demande));
    });
  }

  isOwnMessage(message: DemandeMessage): boolean {
    const currentUser = this.authService.getCurrentUser();
    return message.userId === currentUser?.id;
  }
}
