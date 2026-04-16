import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { I18nService } from '../../core/services/I18n.service';
import { AiService, AiAskResponse } from '../../core/services/ai.service';
import { MessageService } from '../../core/services/message.service';
import { finalize } from 'rxjs';

/**
 * Composant de chat IA pour interagir avec les documents uploadés.
 */
@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TextareaModule],
  template: `
    <p-card class="section-card ai-card">
      <ng-template pTemplate="header">
        <div class="p-3">
          <h3 class="m-0 chart-title">{{ i18n.t().ai.questionsTitle }}</h3>
        </div>
      </ng-template>

      <div class="ai-chat">
        <div class="ai-messages">
          @if (aiMessages().length === 0) {
            <div class="text-600">{{ i18n.t().ai.askStart }}</div>
          } @else {
            @for (message of aiMessages(); track $index) {
              <div class="ai-message" [class.user]="message.role === 'user'">
                <div class="ai-message-meta">
                  {{ message.role === 'user' ? i18n.t().ai.you : i18n.t().ai.ia }} •
                  {{ message.time }}
                </div>
                <div class="ai-message-text">{{ message.text }}</div>
              </div>
            }
          }
          @if (askLoading()) {
            <div class="ai-thinking">{{ i18n.t().ai.thinking }}</div>
          }
        </div>

        <div class="ai-input">
          <textarea
            pInputTextarea
            rows="3"
            class="w-full"
            [placeholder]="i18n.t().ai.askPlaceholder"
            [(ngModel)]="aiQuestion"
            (keydown.enter)="onEnter($event)"
          ></textarea>
          <div class="flex justify-content-end mt-2">
            <p-button
              [label]="i18n.t().ai.send"
              icon="pi pi-send"
              (click)="askAi()"
              [loading]="askLoading()"
              [disabled]="!aiQuestion.trim() || askLoading()"
            ></p-button>
          </div>
        </div>
      </div>
    </p-card>
  `,
  styleUrls: ['./ai-chat.scss']
})
export class AiChatComponent {
  @Input() type: 'admin' | 'client' = 'admin';

  aiMessages = signal<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);
  aiQuestion = '';
  askLoading = signal(false);

  readonly i18n = inject(I18nService);
  private readonly aiService = inject(AiService);
  private readonly messageService = inject(MessageService);

  onEnter(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (!kbEvent.shiftKey) {
      kbEvent.preventDefault();
      if (this.aiQuestion.trim() && !this.askLoading()) {
        this.askAi();
      }
    }
  }

  askAi(): void {
    if (!this.aiQuestion.trim() || this.askLoading()) return;

    const q = this.aiQuestion;
    this.aiMessages.update((msgs) => [
      ...msgs,
      {
        role: 'user',
        text: q,
        time: new Date().toLocaleTimeString(this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    this.aiQuestion = '';
    this.askLoading.set(true);

    const request$ = this.type === 'client' 
      ? this.aiService.askClient(q) 
      : this.aiService.askAdmin(q);

    request$
      .pipe(finalize(() => this.askLoading.set(false)))
      .subscribe({
        next: (res: AiAskResponse) => {
          this.aiMessages.update((msgs) => [
            ...msgs,
            {
              role: 'assistant',
              text: res.response || this.i18n.get('ai.noAnswer'),
              time: new Date().toLocaleTimeString(this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ]);
        },
        error: () => this.messageService.showError(this.i18n.get('ai.askError')),
      });
  }
}
