import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { ApiResponse } from '../../models/api.models';
import {
  Management,
  ManagementRequest,
  Semester,
  SemesterRequest,
} from '../../models/academic-management.model';

@Injectable({ providedIn: 'root' })
export class AcademicManagementService {
  private readonly api = inject(ApiService);

  // ========== MANAGEMENT ==========

  getManagements(): Observable<Management[]> {
    return this.api.get<Management[]>('/managements').pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  createManagement(payload: ManagementRequest): Observable<Management> {
    return this.api.post<Management>('/managements', payload).pipe(
      map(r => r.data)
    );
  }

  updateManagement(id: number, payload: ManagementRequest): Observable<Management> {
    return this.api.put<Management>(`/managements/${id}`, payload).pipe(
      map(r => r.data)
    );
  }

  deleteManagement(id: number): Observable<void> {
    return this.api.delete<void>(`/managements/${id}`).pipe(
      map(() => void 0)
    );
  }

  // ========== SEMESTER ==========

  getSemesters(): Observable<Semester[]> {
    return this.api.get<Semester[]>('/semesters').pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  getSemestersByManagement(managementId: number): Observable<Semester[]> {
    return this.api.get<Semester[]>(`/semesters/by-management/${managementId}`).pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  createSemester(payload: SemesterRequest): Observable<Semester> {
    return this.api.post<Semester>('/semesters', payload).pipe(
      map(r => r.data)
    );
  }

  updateSemester(id: number, payload: SemesterRequest): Observable<Semester> {
    return this.api.put<Semester>(`/semesters/${id}`, payload).pipe(
      map(r => r.data)
    );
  }

  deleteSemester(id: number): Observable<void> {
    return this.api.delete<void>(`/semesters/${id}`).pipe(
      map(() => void 0)
    );
  }
}
