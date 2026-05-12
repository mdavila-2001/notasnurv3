import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';
import { SubjectResponse } from '../../admin/services/admin-subject.service';

export interface TeacherDashboardData {
  averageAttendance: number;
  pendingRecords: number;
  subjectCount: number;
  totalStudents: number;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<ApiResponse<TeacherDashboardData>> {
    return this.api.get<TeacherDashboardData>('/dashboard/teacher');
  }

  getMySubjects(): Observable<ApiResponse<SubjectResponse[]>> {
    return this.api.get<SubjectResponse[]>('/subjects/my-subjects');
  }
}
