import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum DemandeStatus {
  Encours = 1,
  Attente = 2,
  AttenteComagnie = 3,
  Valide = 4
}

export interface Demande {
  id?: number;
  status: DemandeStatus;
  idUser: string;
  idVelo: number;
  discussionId?: number;
  isActif?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = `${environment.urls.coreApi}/Demande`;

  private readonly http = inject(HttpClient);

  getAll(): Observable<Demande[]> {
    return this.http.get<Demande[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.apiUrl}/get-one/${id}`);
  }

  create(demande: Demande): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, demande);
  }

  update(demande: Demande): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, demande);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  updateStatus(id: number, status: DemandeStatus): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-status/${id}`, { status });
  }

  getStatusLabel(status: DemandeStatus): string {
    switch (status) {
      case DemandeStatus.Encours:
        return 'En cours';
      case DemandeStatus.Attente:
        return 'En attente';
      case DemandeStatus.AttenteComagnie:
        return 'Attente Compagnie';
      case DemandeStatus.Valide:
        return 'Validé';
      default:
        return 'Inconnu';
    }
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case DemandeStatus.Encours:
        return 'info';
      case DemandeStatus.Attente:
        return 'warn';
      case DemandeStatus.AttenteComagnie:
        return 'warn';
      case DemandeStatus.Valide:
        return 'success';
      default:
        return 'secondary';
    }
  }
}
