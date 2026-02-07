import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class DemandeService {
  private apiUrl = 'https://localhost:7126/api/Demande';

  constructor(private http: HttpClient) {}

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

  getStatusSeverity(status: DemandeStatus): string {
    switch (status) {
      case DemandeStatus.Encours:
        return 'info';
      case DemandeStatus.Attente:
        return 'warning';
      case DemandeStatus.AttenteComagnie:
        return 'warning';
      case DemandeStatus.Valide:
        return 'success';
      default:
        return 'secondary';
    }
  }
}
