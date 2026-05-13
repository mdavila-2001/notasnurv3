import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/api.models';

const ROLE_DASHBOARD: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/subjects',
};

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRole = route.data['role'] as UserRole | undefined;

  if (requiredRole && !authService.hasRole(requiredRole)) {
    const userRole = authService.getUserRole();
    const fallback = userRole ? ROLE_DASHBOARD[userRole] || '/login' : '/login';
    router.navigate([fallback]);
    return false;
  }

  return true;
};
