import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AdminDashboardApiEnvelope,
  AdminDashboardApiResponse,
  AdminDashboardBackendResponse,
  AdminDashboardSummary,
  DashboardMetricValue,
  CriticalSubject,
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

    const rawSubjects = source.criticalSubjects ?? source.materiasCriticas ?? [];
    const criticalSubjects = Array.isArray(rawSubjects)
      ? rawSubjects.map((item) => this.normalizeCriticalSubject(item))
      : [];

    return {
      totalStudents,
      activeSubjects,
      approvedRate,
      failedRate,
      approvedStudents,
      failedStudents,
      totalEvaluated,
      criticalSubjects: criticalSubjects.slice(0, 5),
      generatedAt: source.generatedAt,
    };
  }

  private normalizeCriticalSubject(item: any): CriticalSubject {
    const id = String(item?.id ?? item?.code ?? item?.codigo ?? Math.random().toString());
    const code = String(item?.code ?? item?.codigo ?? 'MAT-NUR');
    const name = String(item?.name ?? item?.nombre ?? item?.materia ?? 'Materia Académica');
    const teacherName = String(item?.teacherName ?? item?.docente ?? 'Docente Asignado');

    let rawRate = item?.failureRate ?? item?.indiceReprobacion ?? item?.tasaReprobacion ?? 0;
    if (typeof rawRate === 'string') {
      const parsed = parseFloat(rawRate);
      rawRate = Number.isFinite(parsed) ? parsed : 0;
    }
    const failureRate = this.normalizePercentage(rawRate);

    let rawStatus = item?.status ?? item?.estado ?? 'ACTIVA';
    if (typeof rawStatus === 'string') {
      rawStatus = rawStatus.toUpperCase();
    }
    const status: 'CERRADA' | 'ACTIVA' = rawStatus === 'CERRADA' ? 'CERRADA' : 'ACTIVA';

    return {
      id,
      code,
      name,
      teacherName,
      failureRate,
      status,
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
