import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum StatutContrat {
  EnCours = 1,
  Termine = 2,
  Resilie = 2,
}

export interface Contrat {
  id?: number;
  ref: string;
  veloId: number;
  beneficiaireId: string;
  userRhId: string;
  dateDebut: string;
  dateFin: string;
  duree: number;
  loyerMensuelHT: number;
  statutContrat: StatutContrat;
  isActif?: boolean;  
}

@Injectable({
  providedIn: 'root',
})
export class ContratService {
  private apiUrl = 'https://localhost:7126/api/Contrat';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Contrat> {
    return this.http.get<Contrat>(`${this.apiUrl}/get-one/${id}`);
  }

  create(contrat: Contrat): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, contrat);
  }

  update(contrat: Contrat): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, contrat);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  getStatutLabel(statut: StatutContrat): string {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'En cours';
      case StatutContrat.Termine:
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  }
}
