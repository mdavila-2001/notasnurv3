import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiError,
  Management,
  ManagementRequest,
  Semester,
  SemesterRequest,
} from '../models/gestion-academica.model';

@Injectable({
  providedIn: 'root',
})
export class GestionAcademicaService {
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

  // ========== MANAGEMENT ==========

  getManagements(): Observable<Management[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/managements`)
      .pipe(map((response) => this.unwrapArrayResponse<Management>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  createManagement(payload: ManagementRequest): Observable<Management> {
    return this.http
      .post<unknown>(`${this.baseUrl}/managements`, payload)
      .pipe(map((response) => this.unwrapResponse<Management>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateManagement(id: string, payload: ManagementRequest): Observable<Management> {
    return this.http
      .put<unknown>(`${this.baseUrl}/managements/${id}`, payload)
      .pipe(map((response) => this.unwrapResponse<Management>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteManagement(id: string): Observable<void> {
    return this.http
      .delete<unknown>(`${this.baseUrl}/managements/${id}`)
      .pipe(map(() => void 0))
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ========== SEMESTER ==========

  getSemesters(): Observable<Semester[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/semesters`)
      .pipe(map((response) => this.unwrapArrayResponse<Semester>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  getSemestersByManagement(managementId: string): Observable<Semester[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/semesters/by-management/${managementId}`)
      .pipe(map((response) => this.unwrapArrayResponse<Semester>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  createSemester(payload: SemesterRequest): Observable<Semester> {
    return this.http
      .post<unknown>(`${this.baseUrl}/semesters`, payload)
      .pipe(map((response) => this.unwrapResponse<Semester>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateSemester(id: string, payload: SemesterRequest): Observable<Semester> {
    return this.http
      .put<unknown>(`${this.baseUrl}/semesters/${id}`, payload)
      .pipe(map((response) => this.unwrapResponse<Semester>(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteSemester(id: string): Observable<void> {
    return this.http
      .delete<unknown>(`${this.baseUrl}/semesters/${id}`)
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
