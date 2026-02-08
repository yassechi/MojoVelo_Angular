import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ErrorHandlerService } from '../services/error-handler.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Erreur HTTP:', error);

      // Ne pas afficher de toast SEULEMENT pour /login
      const skipToastUrls = ['/login'];
      const shouldSkipToast = skipToastUrls.some(url => req.url.includes(url));

      if (shouldSkipToast || error.status === 0 || error.status === -1) {
        return throwError(() => error);
      }

      errorHandler.handleError(error);

      return throwError(() => error);
    })
  );
};
