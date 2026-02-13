import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Amortissement {
  id: number;
  veloId: number;
  dateDebut: string;
  dureeMois: number;
  valeurInit: number;
  valeurResiduelleFinale: number;
  isActif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AmortissementService {
  private apiUrl = `${environment.urls.legacyApi}/Amortissement`;

  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);

  getAllResource() {
    return runInInjectionContext(this.injector, () =>
      httpResource<Amortissement[]>(
        () => `${this.apiUrl}/get-all`,
        { defaultValue: [] },
      ),
    );
  }

  getOneResource(id: () => number | null) {
    return runInInjectionContext(this.injector, () =>
      httpResource<Amortissement | null>(
        () => {
          const resolvedId = id();
          return resolvedId ? `${this.apiUrl}/${resolvedId}` : undefined;
        },
        { defaultValue: null },
      ),
    );
  }

  getAll(): Observable<Amortissement[]> {
    return this.http.get<Amortissement[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Amortissement> {
    return this.http.get<Amortissement>(`${this.apiUrl}/${id}`);
  }

  create(amortissement: Amortissement): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, amortissement);
  }

  update(amortissement: Amortissement): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, amortissement);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
