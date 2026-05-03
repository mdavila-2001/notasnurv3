import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserResponse, UserRequest, ApiResponse } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class User {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  getUsersByRole(role: string): Observable<UserResponse[]> {
    return this.http
      .get<ApiResponse<UserResponse[]>>(`${this.apiUrl}/role/${role}`)
      .pipe(map((r) => r.data));
  }

  create(userData: UserRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.apiUrl, userData);
  }

  update(
    id: string,
    userData: UserRequest
  ): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}`, userData);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<UserResponse>> {
    return this.http.patch<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}