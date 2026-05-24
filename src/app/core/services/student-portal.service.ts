import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MySubjectResponseDTO,
  KardexResponse,
  UserProfileResponse
} from '../models/enrollment.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class StudentPortalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/enrollments`;
  private readonly authApiUrl = `${environment.apiBaseUrl}/auth`;

  /**
   * Retrieves the list of active subjects enrolled by the current student
   * @returns Observable of MySubjectResponseDTO array
   */
  getMySubjects(): Observable<MySubjectResponseDTO[]> {
    return this.http
      .get<ApiResponse<MySubjectResponseDTO[]>>(`${this.apiUrl}/my-subjects`)
      .pipe(
        map(response => response.data ?? [])
      );
  }

  /**
   * Retrieves the academic history (kardex) for the current student
   * @returns Observable of KardexResponse
   */
  getMyHistory(): Observable<KardexResponse> {
    return this.http
      .get<ApiResponse<KardexResponse>>(`${this.apiUrl}/my-history`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Retrieves the user profile information including CI
   * @returns Observable of UserProfileResponse
   */
  getUserProfile(): Observable<UserProfileResponse> {
    return this.http
      .get<ApiResponse<UserProfileResponse>>(`${this.authApiUrl}/me`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Retrieves subjects, kardex history, and user profile concurrently using forkJoin
   * @returns Observable containing mySubjects, kardexHistory, and userProfile
   */
  getStudentDashboardData(): Observable<{
    mySubjects: MySubjectResponseDTO[];
    kardexHistory: KardexResponse;
    userProfile: UserProfileResponse;
  }> {
    return forkJoin({
      mySubjects: this.getMySubjects(),
      kardexHistory: this.getMyHistory(),
      userProfile: this.getUserProfile()
    });
  }
}
