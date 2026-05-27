import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';
import { GradeRequest, GradeResponse } from '../../../core/models/grade.models';

@Injectable({ providedIn: 'root' })
export class GradeApiService {
  private readonly api = inject(ApiService);

  getGradesBySubject(subjectId: string): Observable<GradeResponse[]> {
    return this.api.get<GradeResponse[]>(`/grades/subject/${subjectId}`).pipe(
      map((response: ApiResponse<GradeResponse[]>) => this.normalizeGrades(response.data ?? [])),
    );
  }

  saveGrades(request: GradeRequest[]): Observable<void> {
    if (request.length === 0) {
      return of(void 0);
    }

    return this.api.post<void>('/grades/bulk', request).pipe(
      map((response: ApiResponse<void>) => response.data),
    );
  }

  private normalizeGrades(grades: GradeResponse[]): GradeResponse[] {
    return grades.map((grade) => ({
      ...grade,
      enrollmentId:
        grade.enrollmentId === null || grade.enrollmentId === undefined
          ? ''
          : String(grade.enrollmentId),
    }));
  }
}
