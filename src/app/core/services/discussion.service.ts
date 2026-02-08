import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Discussion {
  id?: number;
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  createdBy?: string;
  isActif?: boolean;
  objet: string;
  status?: boolean;
  dateCreation?: string;
  clientId: string;
  mojoId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private apiUrl = 'https://localhost:7126/api/Discussion';

  constructor(private http: HttpClient) {}

  create(discussion: Discussion): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, discussion);
  }

  getAll(): Observable<Discussion[]> {
    return this.http.get<Discussion[]>(`${this.apiUrl}/get-all`);
  }

  getOne(id: number): Observable<Discussion> {
    return this.http.get<Discussion>(`${this.apiUrl}/get-one/${id}`);
  }

  update(discussion: Discussion): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, discussion);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
