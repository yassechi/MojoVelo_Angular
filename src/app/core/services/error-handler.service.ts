import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private messageService: MessageService) {}

  handleError(error: any): void {
    let errorMessages: string[] = [];

    // D'abord chercher dans errors (tableau ou objet)
    if (error.error && error.error.errors) {
      if (Array.isArray(error.error.errors)) {
        errorMessages = error.error.errors;
      } else if (typeof error.error.errors === 'object') {
        errorMessages = Object.values(error.error.errors).flat() as string[];
      }
    }

    // Si pas d'errors, utiliser message ou title
    if (errorMessages.length === 0) {
      const fallbackMessage =
        error.error?.message ||
        error.error?.title ||
        error.message ||
        'Une erreur est survenue';

      errorMessages = [fallbackMessage];
    }

    // Afficher chaque message
    errorMessages.forEach((errorMsg, index) => {
      setTimeout(() => {
        this.messageService.add({
          severity: 'error',
          summary: `Erreur ${error.status || ''}`,
          detail: errorMsg,
          life: 8000
        });
      }, index * 100);
    });
  }
}
