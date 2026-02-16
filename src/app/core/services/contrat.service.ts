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

export interface ContratDetail extends Contrat {
  beneficiaireName: string;
  userRhName: string;
  veloMarque?: string;
  veloModele?: string;
  veloNumeroSerie?: string | null;
}

export interface ContratEditUser {
  id: string;
  userName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role?: number;
  isActif?: boolean;
  organisationId?: number;
}

export interface ContratEditVelo {
  id: number;
  numeroSerie: string;
  marque: string;
  modele: string;
  type?: string | null;
  prixAchat?: number;
  status?: boolean;
}

export interface ContratEditData {
  contrat: Contrat;
  users: ContratEditUser[];
  velos: ContratEditVelo[];
}

export interface AdminContratListItem {
  id: number;
  ref: string;
  beneficiaireId: string;
  beneficiaireName: string;
  userRhId: string;
  userRhName: string;
  organisationId: number;
  organisationName: string;
  veloId: number;
  veloMarque: string;
  veloModele: string;
  veloType?: string | null;
  veloPrixAchat: number;
  dateDebut: string;
  dateFin: string;
  loyerMensuelHT: number;
  duree: number;
  statutContrat: StatutContrat;
  incidentsCount: number;
  maintenanceBudget: number;
  maintenanceUsed: number;
  maintenanceProgress: number;
  isEndingSoon: boolean;
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

  getDetail(id: number): Observable<ContratDetail> {
    return this.http.request<ContratDetail>('GET', `${this.apiUrl}/get-detail/${id}`);
  }

  getEditData(id: number): Observable<ContratEditData> {
    return this.http.request<ContratEditData>('GET', `${this.apiUrl}/edit-data/${id}`);
  }

  getByUser(userId: string): Observable<Contrat[]> {
    return this.http.request<Contrat[]>('GET', `${this.apiUrl}/get-by-user/${encodeURIComponent(userId)}`);
  }

  getByOrganisation(organisationId: number): Observable<Contrat[]> {
    return this.http.request<Contrat[]>('GET', `${this.apiUrl}/get-by-organisation/${organisationId}`);
  }

  getList(params?: {
    type?: string | null;
    search?: string | null;
    endingSoon?: boolean | null;
    withIncidents?: boolean | null;
    organisationId?: number | null;
    userId?: string | null;
  }): Observable<AdminContratListItem[]> {
    const query = new URLSearchParams();
    if (params?.type) {
      query.set('type', params.type);
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    if (params?.endingSoon !== null && params?.endingSoon !== undefined) {
      query.set('endingSoon', String(params.endingSoon));
    }
    if (params?.withIncidents !== null && params?.withIncidents !== undefined) {
      query.set('withIncidents', String(params.withIncidents));
    }
    if (params?.organisationId) {
      query.set('organisationId', String(params.organisationId));
    }
    if (params?.userId) {
      query.set('userId', params.userId);
    }
    const suffix = query.toString();
    return this.http.request<AdminContratListItem[]>(
      'GET',
      `${this.apiUrl}/list${suffix ? `?${suffix}` : ''}`,
    );
  }

  exportCsv(params?: {
    type?: string | null;
    search?: string | null;
    endingSoon?: boolean | null;
    withIncidents?: boolean | null;
    organisationId?: number | null;
    userId?: string | null;
  }): Observable<Blob> {
    const query = new URLSearchParams();
    if (params?.type) {
      query.set('type', params.type);
    }
    if (params?.search) {
      query.set('search', params.search);
    }
    if (params?.endingSoon !== null && params?.endingSoon !== undefined) {
      query.set('endingSoon', String(params.endingSoon));
    }
    if (params?.withIncidents !== null && params?.withIncidents !== undefined) {
      query.set('withIncidents', String(params.withIncidents));
    }
    if (params?.organisationId) {
      query.set('organisationId', String(params.organisationId));
    }
    if (params?.userId) {
      query.set('userId', params.userId);
    }
    const suffix = query.toString();
    return this.http.get(`${this.apiUrl}/export${suffix ? `?${suffix}` : ''}`, {
      responseType: 'blob',
    });
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
