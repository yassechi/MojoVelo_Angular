import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

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

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(identifiants: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, identifiants).pipe(
      tap((reponse) => {
        if (reponse && reponse.token) {
          localStorage.setItem('token', reponse.token);
          this.getUserInfo(reponse.id).subscribe((utilisateur) => {
            localStorage.setItem('currentUser', JSON.stringify(utilisateur));
            this.currentUserSubject.next(utilisateur);
            this.redirectToRoleDashboard(utilisateur.role);
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

  private redirectToRoleDashboard(role: UserRole): void {
    switch (role) {
      case UserRole.Admin:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.Manager:
        this.router.navigate(['/manager/dashboard']);
        break;
      case UserRole.User:
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
