import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserDegreeService, UserDegreeResponse, UserDegreeRequest } from './user-degree.service';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('UserDegreeService', () => {
  let service: UserDegreeService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserDegreeService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UserDegreeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET user degrees by user id', () => {
    const mockResponse: UserDegreeResponse[] = [
      { id: 1, studentName: 'Test Student', degreeName: 'Sistemas', type: 'STUDENT', status: 'ACTIVE' }
    ];

    service.getByUserId('usr-123').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/user-degrees/user/usr-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: '', data: mockResponse });
  });

  it('should POST to open user degree record', () => {
    const requestPayload: UserDegreeRequest = {
      userId: 'usr-123',
      degreeId: 10,
      type: 'STUDENT'
    };

    const mockResponse: UserDegreeResponse = {
      id: 1,
      studentName: 'Test Student',
      degreeName: 'Sistemas',
      type: 'STUDENT',
      status: 'ACTIVE'
    };

    service.openRecord(requestPayload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/user-degrees`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestPayload);
    req.flush({ success: true, message: '', data: mockResponse });
  });
});
