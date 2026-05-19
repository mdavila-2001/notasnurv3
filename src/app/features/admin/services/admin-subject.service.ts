import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';
import {
  SubjectCreateUpdateRequest,
  SubjectResponse,
} from '../../../core/models/subject.model';

export type { SubjectCreateUpdateRequest, SubjectResponse } from '../../../core/models/subject.model';

@Injectable({ providedIn: 'root' })
export class AdminSubjectService {
  private readonly api = inject(ApiService);

  getAll(): Observable<ApiResponse<SubjectResponse[]>> {
    return this.api.get<SubjectResponse[]>('/subjects');
  }

  getPaginated(page: number, size: number, sort?: string): Observable<ApiResponse<SubjectResponse[]>> {
    return this.api.get<SubjectResponse[]>('/subjects/paginated', { page, size, sort });
  }

  getById(id: string): Observable<ApiResponse<SubjectResponse>> {
    return this.api.get<SubjectResponse>(`/subjects/${id}`);
  }

  create(payload: SubjectCreateUpdateRequest): Observable<ApiResponse<SubjectResponse>> {
    return this.api.post<SubjectResponse>('/subjects', payload);
  }

  update(id: string, payload: Partial<SubjectCreateUpdateRequest>): Observable<ApiResponse<SubjectResponse>> {
    return this.api.put<SubjectResponse>(`/subjects/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/subjects/${id}`);
  }

  activate(id: string): Observable<ApiResponse<SubjectResponse>> {
    return this.api.put<SubjectResponse>(`/subjects/${id}/activate`, {});
  }

  close(id: string): Observable<ApiResponse<SubjectResponse>> {
    return this.api.put<SubjectResponse>(`/subjects/${id}/close`, {});
  }
}
