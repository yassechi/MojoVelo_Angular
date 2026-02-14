import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum DemandeStatus {
  Encours = 1,
  AttenteComagnie = 2,
  Finalisation = 3,
  Valide = 4,
  Refuse = 5,
}

export interface Demande {
  id?: number;
  status: DemandeStatus;
  idUser: string;
  idVelo: number;
  discussionId?: number;
  isActif?: boolean;
  createdAt?: string;
  accessoiresObligatoires?: string;
  accessoiresSouhaites?: string;
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
      case DemandeStatus.AttenteComagnie:
        return 'Attente Compagnie';
      case DemandeStatus.Finalisation:
        return 'Finalisation';
      case DemandeStatus.Valide:
        return 'Valide';
      case DemandeStatus.Refuse:
        return 'Refuse';
      default:
        return 'Inconnu';
    }
  }

  getStatusSeverity(
    status: DemandeStatus,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case DemandeStatus.Encours:
        return 'success';
      case DemandeStatus.AttenteComagnie:
        return 'success';
      case DemandeStatus.Finalisation:
        return 'success';
      case DemandeStatus.Valide:
        return 'success';
      case DemandeStatus.Refuse:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusClass(status: DemandeStatus): string {
    switch (status) {
      case DemandeStatus.Encours:
        return 'status-tag status-encours';
      case DemandeStatus.AttenteComagnie:
        return 'status-tag status-attente';
      case DemandeStatus.Finalisation:
        return 'status-tag status-finalisation';
      case DemandeStatus.Valide:
        return 'status-tag status-valide';
      case DemandeStatus.Refuse:
        return 'status-tag status-refuse';
      default:
        return 'status-tag';
    }
  }
}
