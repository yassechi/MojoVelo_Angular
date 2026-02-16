import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.urls.coreApi}/Auth`;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(
    (() => {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        return null;
      }
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        localStorage.removeItem('currentUser');
        return null;
      }
    })(),
  );
  public readonly currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // âœ… AJOUT DE getCurrentUser()
  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(
    credentials: LoginRequest,
    options?: { redirectToDashboard?: boolean },
  ): Observable<AuthResponse> {
    const shouldRedirect = options?.redirectToDashboard !== false;
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          // Récupérer les infos complètes de l'utilisateur
          this.getUserInfo(response.id).subscribe((user) => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);

            // âœ… REDIRECTION SELON LE RÃ”LE
            if (shouldRedirect) {
              this.redirectToRoleDashboard(user.role);
            }
          });
        }
      }),
    );
  }

  getUserInfo(userId: string): Observable<User> {
    return this.http.get<User>(`${environment.urls.coreApi}/User/get-one/${userId}`);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private redirectToRoleDashboard(role: number): void {
    switch (role) {
      case 1: // Admin
        this.router.navigate(['/admin/dashboard']);
        break;
      case 2: // Manager
        this.router.navigate(['/manager/dashboard']);
        break;
      case 3: // User
        this.router.navigate(['/user/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  resetPassword(payload: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, payload);
  }

  forgotPassword(payload: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, payload);
  }
}





