import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('AuthGuard', () => {
  let authService: any;
  let router: any;

  const createRoute = (role?: string) => ({
    route: { data: { role } } as any,
    state: { url: '/admin/dashboard' } as any,
  });

  beforeEach(() => {
    authService = {
      isAuthenticated: vi.fn(),
      hasRole: vi.fn(),
      getUserRole: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('authentication check', () => {
    it('should allow when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);
      const { route, state } = createRoute();

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);
      const { route, state } = createRoute();

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/admin/dashboard' },
      });
    });
  });

  describe('role-based access', () => {
    it('should allow when user has required role', () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.hasRole.mockReturnValue(true);
      const { route, state } = createRoute('ADMIN');

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(true);
      expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
    });

    it('should redirect to dashboard when user lacks required role', () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.hasRole.mockReturnValue(false);
      authService.getUserRole.mockReturnValue('TEACHER');
      const { route, state } = createRoute('ADMIN');

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/teacher/dashboard']);
    });

    it('should fallback to /dashboard when user has no recognized role', () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.hasRole.mockReturnValue(false);
      authService.getUserRole.mockReturnValue(null);
      const { route, state } = createRoute('ADMIN');

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('optional role', () => {
    it('should allow any authenticated user when no role specified', () => {
      authService.isAuthenticated.mockReturnValue(true);
      const { route, state } = createRoute();

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      expect(result).toBe(true);
      expect(authService.hasRole).not.toHaveBeenCalled();
    });
  });
});
