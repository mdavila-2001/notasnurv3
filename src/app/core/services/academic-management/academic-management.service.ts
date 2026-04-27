import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ApiError,
  Management,
  ManagementRequest,
  Semester,
  SemesterRequest,
} from '../../models/academic-management.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AcademicManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private unwrapResponse<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  private unwrapArrayResponse<T>(response: ApiResponse<T[]>): T[] {
    return Array.isArray(response.data) ? response.data : [];
  }

  // ========== MANAGEMENT ==========

  getManagements(): Observable<Management[]> {
    return this.http
      .get<ApiResponse<Management[]>>(`${this.baseUrl}/managements`)
      .pipe(map((r) => this.unwrapArrayResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  createManagement(payload: ManagementRequest): Observable<Management> {
    return this.http
      .post<ApiResponse<Management>>(`${this.baseUrl}/managements`, payload)
      .pipe(map((r) => this.unwrapResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateManagement(id: number, payload: ManagementRequest): Observable<Management> {
    return this.http
      .put<ApiResponse<Management>>(`${this.baseUrl}/managements/${id}`, payload)
      .pipe(map((r) => this.unwrapResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteManagement(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/managements/${id}`)
      .pipe(map(() => void 0))
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ========== SEMESTER ==========

  getSemesters(): Observable<Semester[]> {
    return this.http
      .get<ApiResponse<Semester[]>>(`${this.baseUrl}/semesters`)
      .pipe(map((r) => this.unwrapArrayResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  getSemestersByManagement(managementId: number): Observable<Semester[]> {
    return this.http
      .get<ApiResponse<Semester[]>>(`${this.baseUrl}/semesters/by-management/${managementId}`)
      .pipe(map((r) => this.unwrapArrayResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  createSemester(payload: SemesterRequest): Observable<Semester> {
    return this.http
      .post<ApiResponse<Semester>>(`${this.baseUrl}/semesters`, payload)
      .pipe(map((r) => this.unwrapResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateSemester(id: number, payload: SemesterRequest): Observable<Semester> {
    return this.http
      .put<ApiResponse<Semester>>(`${this.baseUrl}/semesters/${id}`, payload)
      .pipe(map((r) => this.unwrapResponse(r)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  deleteSemester(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/semesters/${id}`)
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
