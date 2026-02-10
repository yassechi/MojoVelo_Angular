import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Velo {
  id?: number;
  numeroSerie: string;
  marque: string;
  modele: string;
  prixAchat: number;
  status: boolean;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VeloService {
  private apiUrl = 'http://localhost:5000/api/Velo';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Velo[]> {
    return this.http.get<Velo[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Velo> {
    return this.http.get<Velo>(`${this.apiUrl}/get-one/${id}`);
  }

  create(velo: Velo): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, velo);
  }

  update(velo: Velo): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, velo);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
