import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AcademicManagementService } from './academic-management.service';
import { environment } from '../../../../environments/environment';
import { Management, Semester } from '../../models/academic-management.model';

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
    it('should fetch managements and unwrap response', () => {
      const mockManagements: Management[] = [
        { id: '1', year: 2024 },
        { id: '2', year: 2025 },
      ];
      const mockResponse = { data: mockManagements };

      service.getManagements().subscribe((managements) => {
        expect(managements.length).toBe(2);
        expect(managements).toEqual(mockManagements);
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should create a management', () => {
      const payload = { year: 2026 };
      const mockManagement: Management = { id: '3', ...payload };
      const mockResponse = { data: mockManagement };

      service.createManagement(payload).subscribe((management) => {
        expect(management).toEqual(mockManagement);
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('Semester CRUD', () => {
    it('should fetch semesters by management id', () => {
      const managementId = '1';
      const mockSemesters: Semester[] = [
        { id: 's1', number: 1, startDate: '2024-02-01', endDate: '2024-06-30', managementId },
      ];
      const mockResponse = { data: mockSemesters };

      service.getSemestersByManagement(managementId).subscribe((semesters) => {
        expect(semesters.length).toBe(1);
        expect(semesters[0].id).toBe('s1');
      });

      const req = httpMock.expectOne(`${baseUrl}/semesters/by-management/${managementId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const errorMessage = 'Invalid data';
      
      service.getManagements().subscribe({
        next: () => fail('should have failed with an error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.message).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/managements`);
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
