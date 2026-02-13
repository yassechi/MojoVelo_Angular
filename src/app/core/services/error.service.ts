import { Injectable, inject } from '@angular/core';
import { MessageService, PrimeIcons } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly messageService = inject(MessageService);

  showError(detail: string, summary = 'Erreur'): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      icon: PrimeIcons.EXCLAMATION_TRIANGLE,
    });
  }
}
