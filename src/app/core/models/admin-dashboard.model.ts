export interface ManagementSummary {
  id: number;
  year: number;
  status: ManagementStatus;
  studentCount: number;
  passRate: number;
}

export type ManagementStatus = 'ACTIVE' | 'CLOSED' | 'CONFIGURING' | string;

export interface DashboardAdminBackendResponse {
  totalStudents: number;
  totalSubjectsWithoutTeacher: number;
  totalOpenActas: number;
  globalPassRate: number;
  studentsAtRiskCount: number;
  managements: ManagementSummary[];
}

export interface AdminDashboardSummary extends DashboardAdminBackendResponse {
  globalFailRate: number;
}

export interface AdminDashboardApiEnvelope {
  success: boolean;
  message: string;
  data: DashboardAdminBackendResponse | null;
}

export type AdminDashboardApiResponse = DashboardAdminBackendResponse | AdminDashboardApiEnvelope;
