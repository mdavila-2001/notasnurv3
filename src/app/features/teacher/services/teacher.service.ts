import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';
import { SubjectResponse } from '../../admin/services/admin-subject.service';

export interface SubjectSummary {
  id: number;
  code: string;
  name: string;
  modality: string;
  studentCount: number;
  progressPercentage: number;
}

export interface TeacherDashboardData {
  welcomeMessage: string;
  averageAttendance: number;
  pendingActasCount: number;
  averageCourseGrade: number;
  nextExamDate: string;
  subjects: SubjectSummary[];
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<ApiResponse<TeacherDashboardData>> {
    return this.api.get<TeacherDashboardData>('/dashboard/teacher');
  }

  getMySubjects(): Observable<SubjectResponse[]> {
    return this.api.getRaw<SubjectResponse[]>('/subjects/my-subjects');
  }
}
