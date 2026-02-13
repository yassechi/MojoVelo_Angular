import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Organisation {
  id: number;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  isActif: boolean;
  logoUrl?: string;
  emailAutorise: string;
  idContact: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
  private apiUrl = `${environment.urls.coreApi}/Organisation`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Organisation> {
    return this.http.get<Organisation>(`${this.apiUrl}/get-one/${id}`);
  }

  create(organisation: Organisation): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, organisation);
  }

  update(organisation: Organisation): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, organisation);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
