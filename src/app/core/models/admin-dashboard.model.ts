export interface AdminDashboardSummary {
  totalStudents: number;
  activeSubjects: number;
  approvedRate: number;
  failedRate: number;
  approvedStudents: number;
  failedStudents: number;
  totalEvaluated: number;
  generatedAt?: string;
}

export interface AdminDashboardBackendResponse {
  totalStudents?: DashboardMetricValue;
  totalEstudiantes?: DashboardMetricValue;
  studentsTotal?: DashboardMetricValue;
  activeSubjects?: DashboardMetricValue;
  materiasActivas?: DashboardMetricValue;
  activeCourses?: DashboardMetricValue;
  approvedRate?: DashboardMetricValue;
  approvalRate?: DashboardMetricValue;
  passRate?: DashboardMetricValue;
  approvedPercentage?: DashboardMetricValue;
  indiceAprobados?: DashboardMetricValue;
  failedRate?: DashboardMetricValue;
  failureRate?: DashboardMetricValue;
  reprobationRate?: DashboardMetricValue;
  failedPercentage?: DashboardMetricValue;
  indiceReprobados?: DashboardMetricValue;
  approvedStudents?: DashboardMetricValue;
  passedStudents?: DashboardMetricValue;
  studentsApproved?: DashboardMetricValue;
  aprobados?: DashboardMetricValue;
  failedStudents?: DashboardMetricValue;
  reprobados?: DashboardMetricValue;
  studentsFailed?: DashboardMetricValue;
  totalEvaluated?: DashboardMetricValue;
  evaluatedStudents?: DashboardMetricValue;
  totalCalificados?: DashboardMetricValue;
  generatedAt?: string;
}

export interface AdminDashboardApiEnvelope {
  success?: boolean;
  message?: string;
  data?: AdminDashboardBackendResponse | null;
}

export type AdminDashboardApiResponse = AdminDashboardBackendResponse | AdminDashboardApiEnvelope;
export type DashboardMetricValue = number | string | null | undefined;
