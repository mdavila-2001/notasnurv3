import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminDegreeService, DegreeResponse, DegreeRequest } from './admin-degree.service';
import { environment } from '../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AdminDegreeService', () => {
  let service: AdminDegreeService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminDegreeService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AdminDegreeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET all degrees', () => {
    const mockResponse: DegreeResponse[] = [
      { id: 1, name: 'Sistemas', code: 'SIS', facultyId: 2, facultyName: 'Tecnología' }
    ];

    service.getAll().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/degrees`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: '', data: mockResponse });
  });

  it('should GET degree by id', () => {
    const mockResponse: DegreeResponse = {
      id: 5,
      name: 'Sistemas',
      code: 'SIS',
      facultyId: 2,
      facultyName: 'Tecnología'
    };

    service.getById(5).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/degrees/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: '', data: mockResponse });
  });

  it('should POST to create a degree', () => {
    const payload: DegreeRequest = {
      name: 'Derecho',
      code: 'DER',
      facultyId: 3
    };

    const mockResponse: DegreeResponse = {
      id: 6,
      name: 'Derecho',
      code: 'DER',
      facultyId: 3,
      facultyName: 'Sociales'
    };

    service.create(payload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/degrees`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, message: '', data: mockResponse });
  });

  it('should PUT to update a degree', () => {
    const payload: DegreeRequest = {
      name: 'Derecho Civil',
      code: 'DER',
      facultyId: 3
    };

    const mockResponse: DegreeResponse = {
      id: 6,
      name: 'Derecho Civil',
      code: 'DER',
      facultyId: 3,
      facultyName: 'Sociales'
    };

    service.update(6, payload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${baseUrl}/degrees/6`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, message: '', data: mockResponse });
  });

  it('should DELETE a degree', () => {
    service.delete(6).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/degrees/6`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: '', data: null });
  });
});
