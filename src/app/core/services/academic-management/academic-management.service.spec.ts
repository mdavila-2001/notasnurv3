import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AcademicManagementService } from './academic-management.service';
import { environment } from '../../../../environments/environment';
import { Management, Semester, ManagementRequest, SemesterRequest } from '../../models/academic-management.model';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AcademicManagementService', () => {
  let service: AcademicManagementService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AcademicManagementService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AcademicManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Management CRUD', () => {
    it('should fetch managements and unwrap response data', () => {
      const mockManagements: Management[] = [
        { id: 1, year: 2024 },
        { id: 2, year: 2025 },
      ];
      const mockResponse = { success: true, message: 'Ok', data: mockManagements };

      service.getManagements().subscribe((managements) => {
        expect(managements.length).toBe(2);
        expect(managements).toEqual(mockManagements);
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fallback to empty array on null/non-array data in getManagements', () => {
      service.getManagements().subscribe((managements) => {
        expect(managements).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      req.flush({ success: true, message: 'Ok', data: null });
    });

    it('should create a management', () => {
      const payload: ManagementRequest = { year: 2026 };
      const mockManagement: Management = { id: 3, ...payload };
      const mockResponse = { success: true, message: 'Created', data: mockManagement };

      service.createManagement(payload).subscribe((management) => {
        expect(management).toEqual(mockManagement);
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should update a management', () => {
      const payload: ManagementRequest = { year: 2027 };
      const mockManagement: Management = { id: 3, ...payload };
      const mockResponse = { success: true, message: 'Updated', data: mockManagement };

      service.updateManagement(3, payload).subscribe((management) => {
        expect(management).toEqual(mockManagement);
      });

      const req = httpMock.expectOne(`${baseUrl}/managements/3`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should delete a management', () => {
      const mockResponse = { success: true, message: 'Deleted', data: null as any };

      service.deleteManagement(3).subscribe((res) => {
        expect(res).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/managements/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('Semester CRUD', () => {
    const mockSemester: Semester = {
      id: 10,
      number: 1,
      startDate: '2024-02-01',
      endDate: '2024-06-30',
      managementId: 1,
      managementYear: 2024
    };

    it('should fetch all semesters', () => {
      const mockResponse = { success: true, message: 'Ok', data: [mockSemester] };

      service.getSemesters().subscribe((semesters) => {
        expect(semesters.length).toBe(1);
        expect(semesters[0]).toEqual(mockSemester);
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fallback to empty array on null/non-array data in getSemesters', () => {
      service.getSemesters().subscribe((semesters) => {
        expect(semesters).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters`);
      req.flush({ success: true, message: 'Ok', data: null });
    });

    it('should fetch semesters by management id', () => {
      const managementId = 1;
      const mockResponse = { success: true, message: 'Ok', data: [mockSemester] };

      service.getSemestersByManagement(managementId).subscribe((semesters) => {
        expect(semesters.length).toBe(1);
        expect(semesters[0].id).toBe(10);
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters/by-management/${managementId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fallback to empty array on null/non-array data in getSemestersByManagement', () => {
      service.getSemestersByManagement(1).subscribe((semesters) => {
        expect(semesters).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters/by-management/1`);
      req.flush({ success: true, message: 'Ok', data: null });
    });

    it('should create a semester', () => {
      const payload: SemesterRequest = {
        number: 1,
        startDate: '2024-02-01',
        endDate: '2024-06-30',
        managementId: 1
      };
      const mockResponse = { success: true, message: 'Created', data: mockSemester };

      service.createSemester(payload).subscribe((semester) => {
        expect(semester).toEqual(mockSemester);
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should update a semester', () => {
      const payload: SemesterRequest = {
        number: 2,
        startDate: '2024-07-01',
        endDate: '2024-11-30',
        managementId: 1
      };
      const updatedSemester = { ...mockSemester, number: 2 };
      const mockResponse = { success: true, message: 'Updated', data: updatedSemester };

      service.updateSemester(10, payload).subscribe((semester) => {
        expect(semester).toEqual(updatedSemester);
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters/10`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should delete a semester', () => {
      const mockResponse = { success: true, message: 'Deleted', data: null as any };

      service.deleteSemester(10).subscribe((res) => {
        expect(res).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters/10`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const errorMessage = 'Invalid data';
      
      service.getManagements().subscribe({
        next: () => {
          throw new Error('should have failed with an error');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
