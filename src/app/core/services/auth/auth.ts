import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LoginRequest {
  id: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  role: string;
}

export interface UserProfileResponse {
  id: string;
  ci: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl + '/auth';

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('fullName', response.data.fullName);
          }
        })
      );
  }

  /** Obtiene el perfil actualizado del usuario autenticado desde el servidor */
  getMe(): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.apiUrl}/me`);
  }

  logout(): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/logout`, {})
      .pipe(
        finalize(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('role');
          localStorage.removeItem('fullName');
        })
      );
  }
}
