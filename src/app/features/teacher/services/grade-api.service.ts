import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';
import { GradeBulkRequest, GradeResponse } from '../../../core/models/grade.models';

@Injectable({ providedIn: 'root' })
export class GradeApiService {
  private readonly api = inject(ApiService);

  getGradesBySubject(subjectId: string): Observable<GradeResponse[]> {
    return this.api.get<GradeResponse[]>(`/grades/subject/${subjectId}`).pipe(
      map((response: ApiResponse<GradeResponse[]>) =>
        (response.data ?? []).map((grade) => ({
          ...grade,
          enrollmentId: grade.enrollmentId === null || grade.enrollmentId === undefined
            ? ''
            : String(grade.enrollmentId),
        })),
      ),
    );
  }

  saveGrades(request: GradeBulkRequest): Observable<void> {
    return this.api.post<void>('/grades/save', request).pipe(
      map((response: ApiResponse<void>) => response.data),
    );
  }
}
