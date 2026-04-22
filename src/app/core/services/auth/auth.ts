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

  logout(): Observable<ApiResponse<string>> {
    const token = localStorage.getItem('token');
    let headers = {};
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }

    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        finalize(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('fullName');
        })
      );
  }
}
