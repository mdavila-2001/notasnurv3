import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AdminDashboardApiEnvelope,
  AdminDashboardApiResponse,
  AdminDashboardBackendResponse,
  AdminDashboardSummary,
  DashboardMetricValue,
} from '../../../core/models/admin-dashboard.model';

type DashboardMetricKey = keyof AdminDashboardBackendResponse;

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly api = inject(ApiService);

  getSummary(): Observable<AdminDashboardSummary> {
    return this.api
      .getRaw<AdminDashboardApiResponse>('/dashboard/admin')
      .pipe(map((response) => this.normalizeSummary(this.unwrapResponse(response))));
  }

  private unwrapResponse(response: AdminDashboardApiResponse): AdminDashboardBackendResponse {
    if (this.isEnvelope(response)) {
      return response.data ?? {};
    }

    return response;
  }

  private isEnvelope(response: AdminDashboardApiResponse): response is AdminDashboardApiEnvelope {
    return Object.prototype.hasOwnProperty.call(response, 'data');
  }

  private normalizeSummary(source: AdminDashboardBackendResponse): AdminDashboardSummary {
    const totalStudents = this.readNumber(source, ['totalStudents', 'totalEstudiantes', 'studentsTotal']);
    const activeSubjects = this.readNumber(source, ['activeSubjects', 'materiasActivas', 'activeCourses']);
    const approvedStudents = this.readNumber(source, [
      'approvedStudents',
      'passedStudents',
      'studentsApproved',
      'aprobados',
    ]);
    const failedStudents = this.readNumber(source, ['failedStudents', 'studentsFailed', 'reprobados']);
    const totalEvaluated = this.readNumber(source, ['totalEvaluated', 'evaluatedStudents', 'totalCalificados']);

    const approvedRate = this.resolveRate(
      source,
      ['approvedRate', 'approvalRate', 'passRate', 'approvedPercentage', 'indiceAprobados'],
      approvedStudents,
      totalEvaluated,
    );

    const failedRate = this.resolveRate(
      source,
      ['failedRate', 'failureRate', 'reprobationRate', 'failedPercentage', 'indiceReprobados'],
      failedStudents,
      totalEvaluated,
    );

    return {
      totalStudents,
      activeSubjects,
      approvedRate,
      failedRate,
      approvedStudents,
      failedStudents,
      totalEvaluated,
      generatedAt: source.generatedAt,
    };
  }

  private resolveRate(
    source: AdminDashboardBackendResponse,
    keys: DashboardMetricKey[],
    count: number,
    total: number,
  ): number {
    const explicitRate = this.readOptionalNumber(source, keys);

    if (explicitRate !== null) {
      return this.normalizePercentage(explicitRate);
    }

    if (total <= 0) {
      return 0;
    }

    return this.normalizePercentage((count / total) * 100);
  }

  private readNumber(source: AdminDashboardBackendResponse, keys: DashboardMetricKey[]): number {
    return this.readOptionalNumber(source, keys) ?? 0;
  }

  private readOptionalNumber(source: AdminDashboardBackendResponse, keys: DashboardMetricKey[]): number | null {
    const value = keys
      .map((key) => source[key])
      .find((item): item is Exclude<DashboardMetricValue, null | undefined> => item !== null && item !== undefined && item !== '');

    if (value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizePercentage(value: number): number {
    const percentage = value > 0 && value <= 1 ? value * 100 : value;
    return Math.min(Math.max(percentage, 0), 100);
  }
}
