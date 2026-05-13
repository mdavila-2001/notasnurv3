import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';

export interface SubjectResponse {
  id: string;
  code: string;
  name: string;
  modality: string;
  capacity: number;
  semesterId: string;
  teacherId: string;
  semesterName?: string;
  teacherName?: string;
  recordStatus: string;
  management?: string;
}

export interface SubjectRequest {
  code: string;
  name: string;
  modality: string;
  capacity: number;
  semesterId: string;
  teacherId: string;
}

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

  create(payload: SubjectRequest): Observable<ApiResponse<SubjectResponse>> {
    return this.api.post<SubjectResponse>('/subjects', payload);
  }

  update(id: string, payload: Partial<SubjectRequest>): Observable<ApiResponse<SubjectResponse>> {
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
