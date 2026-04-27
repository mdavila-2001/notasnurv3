import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EnrollmentRequest,
  EnrollmentResponse,
  MySubjectResponseDTO,
  StudentResponseDTO,
} from '../../models/enrollment.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/enrollments`;

  /** ADMIN: Matricular a un estudiante en una materia */
  enrollStudent(request: EnrollmentRequest): Observable<EnrollmentResponse> {
    return this.http
      .post<ApiResponse<EnrollmentResponse>>(this.apiUrl, request)
      .pipe(map((r) => r.data));
  }

  /** ADMIN: Dar de baja a un estudiante (por ID de matrícula) */
  withdrawStudent(enrollmentId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${enrollmentId}`)
      .pipe(map(() => void 0));
  }

  /** ADMIN/TEACHER: Ver alumnos matriculados en una materia */
  getStudentsBySubject(subjectId: number): Observable<StudentResponseDTO[]> {
    return this.http
      .get<ApiResponse<StudentResponseDTO[]>>(`${this.apiUrl}/subject/${subjectId}/students`)
      .pipe(map((r) => r.data));
  }

  /** STUDENT: Ver mis materias matriculadas */
  getMySubjects(): Observable<MySubjectResponseDTO[]> {
    return this.http
      .get<ApiResponse<MySubjectResponseDTO[]>>(`${this.apiUrl}/my-subjects`)
      .pipe(map((r) => r.data));
  }
}
