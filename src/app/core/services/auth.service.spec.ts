import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/api.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthData: AuthResponse = {
    token: 'jwt-token-123',
    fullName: 'John Doe',
    role: 'ADMIN',
  };

  const mockProfileData = {
    id: 'uuid-1',
    ci: '12345',
    fullName: 'John Doe',
    email: 'john@nur.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST credentials and save session to localStorage', () => {
      service.login({ id: 'user', password: 'pass' }).subscribe(response => {
        expect(response.data?.token).toBe('jwt-token-123');
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: 'user', password: 'pass' });
      req.flush({
        success: true,
        message: 'Login exitoso',
        data: mockAuthData,
      });

      expect(localStorage.getItem('token')).toBe('jwt-token-123');
      expect(localStorage.getItem('role')).toBe('ADMIN');
      expect(localStorage.getItem('fullName')).toBe('John Doe');
    });

    it('should not save session on failed login', () => {
      service.login({ id: 'bad', password: 'bad' }).subscribe();

      httpMock.expectOne('/api/auth/login').flush(
        { success: false, message: 'Credenciales inválidas', data: null },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear localStorage', () => {
      localStorage.setItem('token', 'x');
      localStorage.setItem('role', 'ADMIN');
      localStorage.setItem('fullName', 'John');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(localStorage.getItem('fullName')).toBeNull();
    });
  });

  describe('getToken / isAuthenticated', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'abc');
      expect(service.getToken()).toBe('abc');
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getUserRole / hasRole', () => {
    it('should return role from localStorage', () => {
      localStorage.setItem('role', 'TEACHER');
      expect(service.getUserRole()).toBe('TEACHER');
      expect(service.hasRole('TEACHER')).toBeTrue();
      expect(service.hasRole('ADMIN')).toBeFalse();
    });

    it('should return null when no role saved', () => {
      expect(service.getUserRole()).toBeNull();
    });
  });

  describe('getUserFullName', () => {
    it('should return fullName from localStorage', () => {
      localStorage.setItem('fullName', 'Jane Doe');
      expect(service.getUserFullName()).toBe('Jane Doe');
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should GET /auth/me and return profile', () => {
      service.getCurrentUserProfile().subscribe(response => {
        expect(response.data.fullName).toBe('John Doe');
      });

      const req = httpMock.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: mockProfileData });
    });
  });
});
