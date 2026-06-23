import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminUserService, UserRequest } from './admin-user.service';
import { ApiService } from '../../../core/services/api.service';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { UserResponse } from '../../../core/models/api.models';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpMock: HttpTestingController;

  const mockUser: UserResponse = {
    id: 'user-123',
    ci: '1234567',
    name: 'Juan',
    middleName: 'Carlos',
    lastName: 'Perez',
    motherLastName: 'Gomez',
    email: 'j.perez@nur.edu.bo',
    role: 'STUDENT',
    status: 'ACTIVE',
    fullName: 'Juan Carlos Perez Gomez'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminUserService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch users by role', () => {
    const mockResponse = { success: true, message: 'Ok', data: [mockUser] };
    service.getByRole('STUDENT').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/users/role/STUDENT');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch users by role paginated', () => {
    const mockResponse = { success: true, message: 'Ok', data: [mockUser] };
    service.getByRolePaginated('STUDENT', 0, 10, 'name,asc').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users/role/STUDENT/paginated' && r.params.has('page'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('name,asc');
    req.flush(mockResponse);
  });

  it('should create a user', () => {
    const payload: UserRequest = {
      name: 'Juan',
      middleName: 'Carlos',
      lastName: 'Perez',
      motherLastName: 'Gomez',
      ci: '1234567',
      email: 'j.perez@nur.edu.bo',
      role: 'STUDENT',
      status: 'ACTIVE',
      password: 'password123'
    };
    const mockResponse = { success: true, message: 'Ok', data: mockUser };

    service.create(payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should update a user', () => {
    const payload: Partial<UserRequest> = {
      name: 'Juan Carlos Updated'
    };
    const mockResponse = { success: true, message: 'Ok', data: mockUser };

    service.update('user-123', payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/users/user-123');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should delete a user', () => {
    const mockResponse = { success: true, message: 'Deleted', data: null as any };
    service.delete('user-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/users/user-123');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should update user status', () => {
    const mockResponse = { success: true, message: 'Status updated', data: mockUser };
    service.updateStatus('user-123', 'INACTIVE').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/users/user-123/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'INACTIVE' });
    req.flush(mockResponse);
  });
});
