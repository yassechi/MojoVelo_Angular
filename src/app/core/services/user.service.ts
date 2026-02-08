import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum UserRole {
  Admin = 1,
  Manager = 2,
  User = 3
}

export interface User {
  id?: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  isActif: boolean;
  organisationId: number | { id: number; name: string };  // ✅ MODIFIÉ - Support objet populate
  password?: string;
  confirmPassword?: string;
  tailleCm?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authUrl = 'https://localhost:7126/api/Auth';
  private apiUrl = 'https://localhost:7126/api/User';

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/get-one/${id}`);
  }

  create(user: any): Observable<any> {
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      password: user.password,
      confirmPassword: user.password,
      role: Number(user.role),
      tailleCm: Number(user.tailleCm) || 177,
      isActif: Boolean(user.isActif),
      organisationId: Number(user.organisationId)
    };

    console.log('URL appelée :', `${this.authUrl}/register`);
    console.log('Payload :', payload);

    return this.http.post(`${this.authUrl}/register`, payload);
  }

  update(user: any): Observable<any> {
    const payload = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: Number(user.role),
      tailleCm: Number(user.tailleCm) || 177,
      isActif: Boolean(user.isActif),
      organisationId: Number(user.organisationId)
    };

    if (user.password && user.password.trim() !== '') {
      (payload as any).password = user.password;
      (payload as any).confirmPassword = user.password;
    }

    return this.http.put(`${this.apiUrl}/update`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'Administrateur';
      case UserRole.Manager:
        return 'Manager';
      case UserRole.User:
        return 'Utilisateur';
      default:
        return 'Inconnu';
    }
  }
}
