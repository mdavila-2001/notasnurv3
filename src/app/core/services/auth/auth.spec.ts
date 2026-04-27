import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Auth, LoginRequest, AuthResponse, ApiResponse } from './auth';
import { environment } from '../../../../environments/environment';

describe('Auth', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiBaseUrl + '/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Auth,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(Auth);
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

  it('should login and save data to localStorage', () => {
    const credentials: LoginRequest = { id: 'user1', password: 'password' };
    const authData: AuthResponse = { token: 'jwt-token', fullName: 'John Doe', role: 'ADMIN' };
    const mockResponse: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Success',
      data: authData
    };

    service.login(credentials).subscribe((response) => {
      expect(response.success).toBeTrue();
      expect(localStorage.getItem('token')).toBe(authData.token);
      expect(localStorage.getItem('role')).toBe(authData.role);
      expect(localStorage.getItem('fullName')).toBe(authData.fullName);
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout and clear localStorage', () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('role', 'USER');
    localStorage.setItem('fullName', 'Jane Doe');

    const mockResponse: ApiResponse<string> = {
      success: true,
      message: 'Logged out',
      data: 'OK'
    };

    service.logout().subscribe(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(localStorage.getItem('fullName')).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer some-token');
    req.flush(mockResponse);
  });
});
