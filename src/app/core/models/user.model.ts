export interface UserResponse {
  id: string;
  ci: string;
  name: string;
  middleName: string;
  lastName: string;
  motherLastName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE';
  fullName: string;
}

export interface UserRequest {
  name: string;
  middleName?: string;
  lastName: string;
  motherLastName?: string;
  ci: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
