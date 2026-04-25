import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Subject, SubjectRequest } from '../../models/subject.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/subjects`;

  // GET /api/subjects — devuelve array directo (sin wrapper ApiResponse)
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl);
  }

  // POST /api/subjects — devuelve Subject directo (sin wrapper)
  createSubject(payload: SubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl, payload);
  }

  // PUT /api/subjects/{id} — devuelve Subject directo (sin wrapper)
  updateSubject(id: number, payload: SubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/${id}`, payload);
  }

  // DELETE /api/subjects/{id} — 204 sin cuerpo
  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // PUT /api/subjects/{id}/activate — devuelve ApiResponse<Subject>
  activateSubject(id: number): Observable<Subject> {
    return this.http
      .put<ApiResponse<Subject>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(map((r) => r.data));
  }
}
