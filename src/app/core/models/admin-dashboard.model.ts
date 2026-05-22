export interface CriticalSubject {
  id: string;
  code: string;
  name: string;
  teacherName: string;
  failureRate: number;
  status: 'CERRADA' | 'ACTIVA';
}

export interface CriticalSubjectBackend {
  id?: string | number;
  code?: string;
  codigo?: string;
  name?: string;
  nombre?: string;
  materia?: string;
  teacherName?: string;
  docente?: string;
  failureRate?: number | string;
  indiceReprobacion?: number | string;
  tasaReprobacion?: number | string;
  status?: string;
  estado?: string;
}

export interface AdminDashboardSummary {
  totalStudents: number;
  activeSubjects: number;
  approvedRate: number;
  failedRate: number;
  approvedStudents: number;
  failedStudents: number;
  totalEvaluated: number;
  criticalSubjects: CriticalSubject[];
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
  criticalSubjects?: CriticalSubjectBackend[] | null;
  materiasCriticas?: CriticalSubjectBackend[] | null;
  generatedAt?: string;
}

export interface AdminDashboardApiEnvelope {
  success?: boolean;
  message?: string;
  data?: AdminDashboardBackendResponse | null;
}

export type AdminDashboardApiResponse = AdminDashboardBackendResponse | AdminDashboardApiEnvelope;
export type DashboardMetricValue = number | string | null | undefined;

