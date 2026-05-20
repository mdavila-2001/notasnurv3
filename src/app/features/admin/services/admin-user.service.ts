import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, UserResponse, UserRole, UserStatus } from '../../../core/models/api.models';

export interface UserRequest {
  name: string;
  middleName: string;
  lastName: string;
  motherLastName: string;
  ci: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly api = inject(ApiService);

  getByRole(role: UserRole): Observable<ApiResponse<UserResponse[]>> {
    return this.api.get<UserResponse[]>(`/users/role/${role}`);
  }

  getByRolePaginated(role: UserRole, page: number, size: number, sort?: string): Observable<ApiResponse<UserResponse[]>> {
    return this.api.get<UserResponse[]>(`/users/role/${role}/paginated`, { page, size, sort });
  }

  create(payload: UserRequest): Observable<ApiResponse<UserResponse>> {
    return this.api.post<UserResponse>('/users', payload);
  }

  update(id: string, payload: Partial<UserRequest>): Observable<ApiResponse<UserResponse>> {
    return this.api.put<UserResponse>(`/users/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/users/${id}`);
  }

  updateStatus(id: string, status: UserStatus): Observable<ApiResponse<UserResponse>> {
    return this.api.patch<UserResponse>(`/users/${id}/status`, { status });
  }
}
