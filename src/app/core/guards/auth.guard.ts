import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // const routePublic =
  //   state.url.startsWith('/user/demandes/new') || /\/user\/demandes\/\d+\/edit/.test(state.url);
  // if (routePublic) {
  //   return true;
  // }

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const currentUser = authService.getCurrentUser();
  const requiredRole = route.data['role'];

  if (!requiredRole) {
    return true;
  }

  if (currentUser && currentUser.role === requiredRole) {
    return true;
  }

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
