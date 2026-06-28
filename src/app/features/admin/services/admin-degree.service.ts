import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';

export interface DegreeResponse {
  id: number;
  name: string;
  code: string;
  facultyId: number;
  facultyName: string;
}

export interface DegreeRequest {
  name: string;
  code: string;
  facultyId: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDegreeService {
  private readonly api = inject(ApiService);

  getAll(): Observable<ApiResponse<DegreeResponse[]>> {
    return this.api.get<DegreeResponse[]>('/degrees');
  }

  getById(id: number): Observable<ApiResponse<DegreeResponse>> {
    return this.api.get<DegreeResponse>(`/degrees/${id}`);
  }

  create(payload: DegreeRequest): Observable<ApiResponse<DegreeResponse>> {
    return this.api.post<DegreeResponse>('/degrees', payload);
  }

  update(id: number, payload: DegreeRequest): Observable<ApiResponse<DegreeResponse>> {
    return this.api.put<DegreeResponse>(`/degrees/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/degrees/${id}`);
  }
}
