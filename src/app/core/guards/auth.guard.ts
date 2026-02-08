
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Récupérer l'utilisateur actuel et le rôle requis
  const currentUser = authService.getCurrentUser();
  const requiredRole = route.data['role'];

  // Si aucun rôle n'est requis, laisser passer
  if (!requiredRole) {
    return true;
  }

  // Vérifier si l'utilisateur a le bon rôle
  if (currentUser && currentUser.role === requiredRole) {
    return true;
  }

  // Rediriger vers le dashboard approprié selon le rôle
  if (currentUser) {
    switch (currentUser.role) {
      case 1: // Admin
        router.navigate(['/admin/dashboard']);
        break;
      case 2: // Manager
        router.navigate(['/manager/dashboard']);
        break;
      case 3: // User
        router.navigate(['/user/dashboard']);
        break;
      default:
        router.navigate(['/login']);
    }
  } else {
    router.navigate(['/login']);
  }

  return false;
};

