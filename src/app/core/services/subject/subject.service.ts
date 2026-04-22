import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Subject, SubjectRequest } from '../../models/subject.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/subjects`;

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl);
  }

  createSubject(payload: SubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl, payload);
  }

  updateSubject(id: string, payload: SubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/${id}`, payload);
  }

  deleteSubject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
