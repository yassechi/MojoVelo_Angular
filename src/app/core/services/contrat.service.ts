import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum StatutContrat {
  EnCours = 1,
  Termine = 2,
  Resilie = 3,
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
  private apiUrl = `${environment.urls.coreApi}/Contrat`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Contrat[]> {
    return this.http.request<Contrat[]>('GET', `${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Contrat> {
    return this.http.request<Contrat>('GET', `${this.apiUrl}/get-one/${id}`);
  }

  create(contrat: Contrat): Observable<any> {
    return this.http.request('POST', `${this.apiUrl}/add`, { body: contrat });
  }

  update(contrat: Contrat): Observable<any> {
    return this.http.request('PUT', `${this.apiUrl}/update`, { body: contrat });
  }

  delete(id: number): Observable<any> {
    return this.http.request('DELETE', `${this.apiUrl}/delete/${id}`);
  }

  getStatutLabel(statut: StatutContrat): string {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'En cours';
      case StatutContrat.Termine:
        return 'Terminé';
      case StatutContrat.Resilie:
        return 'Résilié';
      default:
        return 'Inconnu';
    }
  }
}
