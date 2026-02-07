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
  organisationId: number;
  password?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7126/api/User';

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/get-one/${id}`);
  }

  create(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, user);
  }

  update(user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, user);
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
