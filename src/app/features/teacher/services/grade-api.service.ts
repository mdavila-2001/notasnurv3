import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GradeBulkRequest, GradeResponse } from '../../../core/models/grade.models';

@Injectable({ providedIn: 'root' })
export class GradeApiService {
  private readonly http = inject(HttpClient);

  getGradesBySubject(subjectId: string): Observable<GradeResponse[]> {
    return this.http.get<GradeResponse[]>(`/api/grades/subject/${subjectId}`);
  }

  saveGrades(request: GradeBulkRequest): Observable<void> {
    return this.http.post<void>('/api/grades/save', request);
  }
}