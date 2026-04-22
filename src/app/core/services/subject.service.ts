import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subject, SubjectRequest, ApiError } from '../models/subject.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private unwrapResponse<T>(response: unknown): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data: T }).data;
    }
    return response as T;
  }

  private unwrapArrayResponse<T>(response: unknown): T[] {
    const data = this.unwrapResponse<unknown>(response);
    return Array.isArray(data) ? (data as T[]) : [];
  }

  getSubjects(): Observable<Subject[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/subjects`)
      .pipe(map((response) => this.unwrapArrayResponse<Subject>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  createSubject(payload: SubjectRequest): Observable<Subject> {
    return this.http
      .post<unknown>(`${this.baseUrl}/subjects`, payload)
      .pipe(map((response) => this.unwrapResponse<Subject>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateSubject(id: string, payload: SubjectRequest): Observable<Subject> {
    return this.http
      .put<unknown>(`${this.baseUrl}/subjects/${id}`, payload)
      .pipe(map((response) => this.unwrapResponse<Subject>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteSubject(id: string): Observable<void> {
    return this.http
      .delete<unknown>(`${this.baseUrl}/subjects/${id}`)
      .pipe(map(() => void 0))
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    const apiError: ApiError = {
      status: error.status,
      message:
        typeof error.error?.message === 'string'
          ? error.error.message
          : error.message || 'Error inesperado al comunicarse con el servidor.',
      details: error.error,
    };
    return throwError(() => apiError);
  }
}
