export interface ApiResponse<T> {
  success: boolean;
  message: string
  data: T
}

export interface AuthResponse {
  token: string
  fullName: string
  role: string
}

export interface UserProfileResponse {
  id: string
  ci: string
  fullName: string
  email: string
  role: string
  status: string
}

export interface UserResponse {
  id: string
  ci: string
  name: string
  middleName: string
  lastName: string
  motherLastName: string
  email: string
  role: string
  status: string
  fullName: string
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED';

export interface LoginRequest {
  id: string;
  password: string;
}

export interface AuditLogResponse {
  id: string;
  userId: string | null;
  userFullName: string;
  userEmail: string;
  affectedTable: string;
  recordId: string;
  oldValue: string | null;
  newValue: string | null;
  action: string;
  changedAt: string;
  ipAddress: string | null;
}
