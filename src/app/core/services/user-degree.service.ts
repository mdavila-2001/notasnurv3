import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.models';

export interface UserDegreeResponse {
  id: number;
  studentName: string;
  degreeName: string;
  type: string;
  status: string;
}

export interface UserDegreeRequest {
  userId: string;
  degreeId: number;
  type: 'STUDENT' | 'TEACHER';
}

@Injectable({ providedIn: 'root' })
export class UserDegreeService {
  private readonly api = inject(ApiService);

  getByUserId(userId: string): Observable<ApiResponse<UserDegreeResponse[]>> {
    return this.api.get<UserDegreeResponse[]>(`/user-degrees/user/${userId}`);
  }

  openRecord(payload: UserDegreeRequest): Observable<ApiResponse<UserDegreeResponse>> {
    return this.api.post<UserDegreeResponse>('/user-degrees', payload);
  }
}
