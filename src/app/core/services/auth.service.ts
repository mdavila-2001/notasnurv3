import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, AuthResponse, UserProfileResponse, UserRole, LoginRequest } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiService = inject(ApiService);

  private readonly TOKEN_KEY = 'token';
  private readonly ROLE_KEY = 'role';
  private readonly FULL_NAME_KEY = 'fullName';

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.FULL_NAME_KEY);
  }

  getCurrentUserProfile(): Observable<ApiResponse<UserProfileResponse>> {
    return this.apiService.get<UserProfileResponse>('/auth/me');
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): UserRole | null {
    return localStorage.getItem(this.ROLE_KEY) as UserRole | null;
  }

  getUserFullName(): string | null {
    return localStorage.getItem(this.FULL_NAME_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.ROLE_KEY, authData.role);
    localStorage.setItem(this.FULL_NAME_KEY, authData.fullName);
  }
}
