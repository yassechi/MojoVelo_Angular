import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Intervention {
  id: number;
  veloId: number;
  typeIntervention: string;
  description: string;
  dateIntervention: string;
  cout: number;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InterventionService {
  private apiUrl = `${environment.urls.legacyApi}/Intervention`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Intervention> {
    return this.http.get<Intervention>(`${this.apiUrl}/get-one/${id}`);
  }

  create(intervention: Intervention): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, intervention);
  }

  update(intervention: Intervention): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, intervention);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
