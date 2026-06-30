import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';

export interface FacultyResponse {
  id: number;
  name: string;
  code: string;
}

export interface FacultyRequest {
  name: string;
  code: string;
}

@Injectable({ providedIn: 'root' })
export class AdminFacultyService {
  private readonly api = inject(ApiService);

  getAll(): Observable<ApiResponse<FacultyResponse[]>> {
    return this.api.get<FacultyResponse[]>('/faculties');
  }

  getById(id: number): Observable<ApiResponse<FacultyResponse>> {
    return this.api.get<FacultyResponse>(`/faculties/${id}`);
  }

  create(payload: FacultyRequest): Observable<ApiResponse<FacultyResponse>> {
    return this.api.post<FacultyResponse>('/faculties', payload);
  }

  update(id: number, payload: FacultyRequest): Observable<ApiResponse<FacultyResponse>> {
    return this.api.put<FacultyResponse>(`/faculties/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/faculties/${id}`);
  }
}
