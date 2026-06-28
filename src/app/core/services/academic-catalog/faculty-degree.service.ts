import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  Faculty, FacultyRequest,
  Degree, DegreeRequest,
  UserDegree, UserDegreeRequest,
} from '../../models/faculty-degree.model';

@Injectable({ providedIn: 'root' })
export class FacultyDegreeService {
  private readonly api = inject(ApiService);

  // ========== FACULTIES ==========

  getFaculties(): Observable<Faculty[]> {
    return this.api.get<Faculty[]>('/faculties').pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  createFaculty(payload: FacultyRequest): Observable<Faculty> {
    return this.api.post<Faculty>('/faculties', payload).pipe(map(r => r.data));
  }

  updateFaculty(id: number, payload: FacultyRequest): Observable<Faculty> {
    return this.api.put<Faculty>(`/faculties/${id}`, payload).pipe(map(r => r.data));
  }

  deleteFaculty(id: number): Observable<void> {
    return this.api.delete<void>(`/faculties/${id}`).pipe(map(() => void 0));
  }

  // ========== DEGREES ==========

  getDegrees(): Observable<Degree[]> {
    return this.api.get<Degree[]>('/degrees').pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  createDegree(payload: DegreeRequest): Observable<Degree> {
    return this.api.post<Degree>('/degrees', payload).pipe(map(r => r.data));
  }

  updateDegree(id: number, payload: DegreeRequest): Observable<Degree> {
    return this.api.put<Degree>(`/degrees/${id}`, payload).pipe(map(r => r.data));
  }

  deleteDegree(id: number): Observable<void> {
    return this.api.delete<void>(`/degrees/${id}`).pipe(map(() => void 0));
  }

  // ========== USER DEGREES (ACADEMIC RECORDS) ==========

  getUserDegrees(userId: string): Observable<UserDegree[]> {
    return this.api.get<UserDegree[]>(`/user-degrees/user/${userId}`).pipe(
      map(r => Array.isArray(r.data) ? r.data : [])
    );
  }

  createUserDegree(payload: UserDegreeRequest): Observable<UserDegree> {
    return this.api.post<UserDegree>('/user-degrees', payload).pipe(map(r => r.data));
  }
}
