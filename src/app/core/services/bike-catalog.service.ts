import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BikeAcf {
  prix?: number;
  prix_par_mois?: number;
  type?: string;
  assistance?: string;
  genre?: string;
  marchand?: string;
  localisation?: string;
}

export interface BikeItem {
  id: number;
  title: { rendered: string };
  featured_media?: number;
  bikes_brand?: number[];
  acf?: BikeAcf;
  link?: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: { sizes?: Record<string, { source_url?: string }> };
    }>;
  };
}

export interface BikeBrand {
  id: number;
  name: string;
  slug?: string;
  link?: string;
}

export interface CmsListResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class BikeCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.urls.cmsApi;

  getBikes(perPage = 100, page = 1, embed = false): Observable<CmsListResponse<BikeItem>> {
    let params = new HttpParams().set('per_page', String(perPage)).set('page', String(page));
    if (embed) {
      params = params.set('_embed', '1');
    }
    return this.http
      .get<BikeItem[]>(`${this.baseUrl}/bikes`, { params, observe: 'response' })
      .pipe(
        map((response) => ({
          items: response.body ?? [],
          total: Number(response.headers.get('X-WP-Total') ?? 0),
          totalPages: Number(response.headers.get('X-WP-TotalPages') ?? 0),
        })),
      );
  }

  getBrands(perPage = 100, page = 1): Observable<CmsListResponse<BikeBrand>> {
    const params = new HttpParams().set('per_page', String(perPage)).set('page', String(page));
    return this.http
      .get<BikeBrand[]>(`${this.baseUrl}/bikes_brand`, { params, observe: 'response' })
      .pipe(
        map((response) => ({
          items: response.body ?? [],
          total: Number(response.headers.get('X-WP-Total') ?? 0),
          totalPages: Number(response.headers.get('X-WP-TotalPages') ?? 0),
        })),
      );
  }
}
