import { Injectable, inject } from '@angular/core';
import { MessageService as PrimeMessageService, PrimeIcons } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly primeMessageService = inject(PrimeMessageService);

  showError(detail: string, summary = 'Erreur'): void {
    this.primeMessageService.add({
      severity: 'error',
      summary,
      detail,
      icon: PrimeIcons.EXCLAMATION_TRIANGLE,
    });
  }
}


