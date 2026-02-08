import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7126/api/Auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // ✅ AJOUT DE getCurrentUser()
  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response && response.token) {
            // Récupérer les infos complètes de l'utilisateur
            this.getUserInfo(response.id).subscribe(user => {
              localStorage.setItem('token', response.token);
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.currentUserSubject.next(user);

              // ✅ REDIRECTION SELON LE RÔLE
              this.redirectToRoleDashboard(user.role);
            });
          }
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          if (response && response.token) {
            // Récupérer les infos complètes de l'utilisateur
            this.getUserInfo(response.id).subscribe(user => {
              localStorage.setItem('token', response.token);
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.currentUserSubject.next(user);

              setTimeout(() => {
                // ✅ REDIRECTION SELON LE RÔLE
                this.redirectToRoleDashboard(user.role);
              }, 1000);
            });
          }
        })
      );
  }

  getUserInfo(userId: string): Observable<User> {
    return this.http.get<User>(`https://localhost:7126/api/User/get-one/${userId}`);
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

  // // ✅ NOUVELLE MÉTHODE - Redirection selon le rôle
  // private redirectToRoleDashboard(role: number): void {
  //   switch (role) {
  //     case 1: // Admin
  //       this.router.navigate(['/admin/dashboard']);
  //       break;
  //     case 2: // Manager
  //       this.router.navigate(['/manager/dashboard']);
  //       break;
  //     case 3: // User
  //       this.router.navigate(['/user/dashboard']);
  //       break;
  //     default:
  //       this.router.navigate(['/login']);
  //   }
  // }

  private redirectToRoleDashboard(role: number): void {
  console.log('🔍 REDIRECTION - Role:', role);
  switch (role) {
    case 1: // Admin
      console.log('➡️ Redirection vers /admin/dashboard');
      this.router.navigate(['/admin/dashboard']);
      break;
    case 2: // Manager
      console.log('➡️ Redirection vers /manager/dashboard');
      this.router.navigate(['/manager/dashboard']);
      break;
    case 3: // User
      console.log('➡️ Redirection vers /user/dashboard');
      this.router.navigate(['/user/dashboard']);
      break;
    default:
      console.log('➡️ Redirection vers /login');
      this.router.navigate(['/login']);
  }
}
}
