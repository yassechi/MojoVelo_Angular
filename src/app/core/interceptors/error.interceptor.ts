import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from '../services/error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((xhr: HttpErrorResponse) => {
      // Ne pas afficher de toast pour /login ou certains appels legacy non critiques
      const skipToastUrls = ['/login', '/Amortissement/get-all'];
      const shouldSkipToast = skipToastUrls.some((url) => req.url.includes(url));
      if (shouldSkipToast) {
        return throwError(() => xhr);
      }

      console.error('Erreur HTTP:', xhr);
      const extractErrorMessage = (error: any): string | null => {
        if (!error) return null;
        if (typeof error === 'string') return error;
        if (Array.isArray(error)) return error.join(', ');

        if (error.errors) {
          if (Array.isArray(error.errors)) return error.errors.join(', ');
          if (typeof error.errors === 'object') {
            return Object.values(error.errors).flat().join(', ');
          }
        }

        if (error.message) return error.message;
        if (error.title) return error.title;
        return null;
      };

      let detail = '';
      switch (xhr.status) {
        case 400:
          detail = extractErrorMessage(xhr.error) || 'Requête invalide';
          break;
        case 401:
        case 403:
          detail = extractErrorMessage(xhr.error) || 'Accès refusé';
          break;
        case 404:
          detail = "L'adresse du serveur est introuvable";
          break;
        case 418:
          detail = "I'm a teapot !!";
          break;
        default:
          detail = 'La connexion au serveur a échoué';
          break;
      }

      errorService.showError(detail);

      return throwError(() => xhr);
    })
  );
};

