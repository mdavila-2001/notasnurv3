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

  getMySubjects(): Observable<MySubjectResponseDTO[]> {
    return this.http
      .get<ApiResponse<MySubjectResponseDTO[]>>(`${this.apiUrl}/my-subjects`)
      .pipe(
        map(response => response.data ?? [])
      );
  }

  getMyHistory(): Observable<KardexResponse> {
    return this.http
      .get<ApiResponse<KardexResponse>>(`${this.apiUrl}/my-history`)
      .pipe(
        map(response => response.data)
      );
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http
      .get<ApiResponse<UserProfileResponse>>(`${this.authApiUrl}/me`)
      .pipe(
        map(response => response.data)
      );
  }

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

  getStudentDashboard(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${environment.apiBaseUrl}/dashboard/student`)
      .pipe(
        map(response => response.data)
      );
  }
}
