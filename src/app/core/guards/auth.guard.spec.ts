import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('AuthGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const createRoute = (role?: string) => ({
    route: { data: { role } } as any,
    state: { url: '/admin/dashboard' } as any,
  });

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'hasRole',
      'getUserRole',
    ]);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('authentication check', () => {
    it('should allow when authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);
      const { route, state } = createRoute();

      const result = authGuard(route, state);

      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);
      const { route, state } = createRoute();

      const result = authGuard(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/admin/dashboard' },
      });
    });
  });

  describe('role-based access', () => {
    it('should allow when user has required role', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.hasRole.and.returnValue(true);
      const { route, state } = createRoute('ADMIN');

      const result = authGuard(route, state);

      expect(result).toBeTrue();
      expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
    });

    it('should redirect to dashboard when user lacks required role', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.hasRole.and.returnValue(false);
      authService.getUserRole.and.returnValue('TEACHER');
      const { route, state } = createRoute('ADMIN');

      const result = authGuard(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/teacher/dashboard']);
    });

    it('should fallback to /dashboard when user has no recognized role', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.hasRole.and.returnValue(false);
      authService.getUserRole.and.returnValue(null);
      const { route, state } = createRoute('ADMIN');

      const result = authGuard(route, state);

      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('optional role', () => {
    it('should allow any authenticated user when no role specified', () => {
      authService.isAuthenticated.and.returnValue(true);
      const { route, state } = createRoute();

      const result = authGuard(route, state);

      expect(result).toBeTrue();
      expect(authService.hasRole).not.toHaveBeenCalled();
    });
  });
});
