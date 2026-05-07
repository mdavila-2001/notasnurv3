import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Subject, SubjectRequest } from '../../models/subject.model';
import { MySubject } from '../../models/my-subject.model';

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

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl);
  }

  getMySubjects(): Observable<ApiResponse<MySubject[]>> {
    return this.http.get<ApiResponse<MySubject[]>>(`${this.apiUrl}/my-subjects`);
  }

  createSubject(payload: SubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl, payload);
  }

  updateSubject(id: number, payload: SubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/${id}`, payload);
  }
  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activateSubject(id: number): Observable<Subject> {
    return this.http
      .put<ApiResponse<Subject>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(map((r) => r.data));
  }
}
