import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';
import { GradeBulkRequest, GradeResponse } from '../../../core/models/grade.models';

type GradesEndpointResponse = ApiResponse<GradeResponse[]> | GradeResponse[];

@Injectable({ providedIn: 'root' })
export class GradeApiService {
  private readonly api = inject(ApiService);

  getGradesBySubject(subjectId: string): Observable<GradeResponse[]> {
    return this.api.getRaw<GradesEndpointResponse>(`/grades/subject/${subjectId}`).pipe(
      map((response) => Array.isArray(response) ? response : response.data ?? []),
    );
  }

  saveGrades(request: GradeBulkRequest): Observable<void> {
    return this.api.post<void>('/grades/save', request).pipe(
      map(() => undefined),
    );
  }
}
