import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiscussionMessage {
  id?: number;
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  createdBy?: string;
  isActif?: boolean;
  contenu: string;
  dateEnvoi?: string;
  userId: string;
  discussionId: number;
}

@Injectable({
  providedIn: 'root',
})
export class MessageApiService {
  private apiUrl = `${environment.urls.coreApi}/Message`;

  private readonly http = inject(HttpClient);

  create(message: DiscussionMessage): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, message);
  }

  getByDiscussion(discussionId: number): Observable<DiscussionMessage[]> {
    return this.http.get<DiscussionMessage[]>(`${this.apiUrl}/get-by-discussion/${discussionId}`);
  }
}
