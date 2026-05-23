import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AdminDashboardApiEnvelope, AdminDashboardApiResponse, AdminDashboardSummary, DashboardAdminBackendResponse, ManagementSummary } from '../../../core/models/admin-dashboard.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly api = inject(ApiService);

  getSummary(): Observable<AdminDashboardSummary> {
    return this.api
      .getRaw<AdminDashboardApiResponse>('/dashboard/admin')
      .pipe(map((response) => this.normalizeSummary(this.unwrapResponse(response))));
  }

  private unwrapResponse(response: AdminDashboardApiResponse): DashboardAdminBackendResponse {
    if (this.isEnvelope(response)) {
      return response.data ?? this.emptyDashboard();
    }

    return response;
  }

  private isEnvelope(response: AdminDashboardApiResponse): response is AdminDashboardApiEnvelope {
    return typeof response === 'object' && response !== null && 'data' in response;
  }

  private normalizeSummary(source: DashboardAdminBackendResponse): AdminDashboardSummary {
    const globalPassRate = this.normalizePercentage(source.globalPassRate);

    return {
      totalStudents: this.normalizeCount(source.totalStudents),
      totalSubjectsWithoutTeacher: this.normalizeCount(source.totalSubjectsWithoutTeacher),
      totalOpenActas: this.normalizeCount(source.totalOpenActas),
      globalPassRate,
      globalFailRate: this.normalizePercentage(100 - globalPassRate),
      studentsAtRiskCount: this.normalizeCount(source.studentsAtRiskCount),
      managements: this.normalizeManagements(source.managements),
    };
  }

  private normalizeManagements(managements: ManagementSummary[] | null | undefined): ManagementSummary[] {
    if (!Array.isArray(managements)) {
      return [];
    }

    return managements.map((management) => ({
      id: this.normalizeCount(management.id),
      year: this.normalizeCount(management.year),
      status: management.status,
      studentCount: this.normalizeCount(management.studentCount),
      passRate: this.normalizePercentage(management.passRate),
    }));
  }

  private emptyDashboard(): DashboardAdminBackendResponse {
    return {
      totalStudents: 0,
      totalSubjectsWithoutTeacher: 0,
      totalOpenActas: 0,
      globalPassRate: 0,
      studentsAtRiskCount: 0,
      managements: [],
    };
  }

  private normalizeCount(value: number | null | undefined): number {
    return Number.isFinite(value) ? Number(value) : 0;
  }

  private normalizePercentage(value: number | null | undefined): number {
    const numericValue = Number.isFinite(value) ? Number(value) : 0;
    const percentage = numericValue > 0 && numericValue <= 1 ? numericValue * 100 : numericValue;
    return Math.min(Math.max(percentage, 0), 100);
  }
}
