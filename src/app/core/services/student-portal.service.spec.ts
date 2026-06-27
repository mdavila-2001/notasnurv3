import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StudentPortalService } from './student-portal.service';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { environment } from '../../../environments/environment';

describe('StudentPortalService', () => {
  let service: StudentPortalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentPortalService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(StudentPortalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get subjects and fallback to empty array on null data', () => {
    service.getMySubjects().subscribe((res) => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/enrollments/my-subjects`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'OK', data: null });
  });

  it('should get subjects and return actual data', () => {
    const mockSubjects = [{ id: '1', name: 'Math' } as any];
    service.getMySubjects().subscribe((res) => {
      expect(res).toEqual(mockSubjects);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/enrollments/my-subjects`);
    req.flush({ success: true, message: 'OK', data: mockSubjects });
  });

  it('should get history data', () => {
    const mockHistory = { id: 'kardex-1', studentName: 'Juan' } as any;
    service.getMyHistory().subscribe((res) => {
      expect(res).toEqual(mockHistory);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/enrollments/my-history`);
    req.flush({ success: true, message: 'OK', data: mockHistory });
  });

  it('should get user profile', () => {
    const mockProfile = { id: 'user-1', email: 'user@nur.edu.bo' } as any;
    service.getUserProfile().subscribe((res) => {
      expect(res).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/me`);
    req.flush({ success: true, message: 'OK', data: mockProfile });
  });

  it('should get dashboard data concurrently via getStudentDashboardData', () => {
    const mockSubjects = [{ id: '1', name: 'Math' } as any];
    const mockHistory = { id: 'kardex-1', studentName: 'Juan' } as any;
    const mockProfile = { id: 'user-1', email: 'user@nur.edu.bo' } as any;

    service.getStudentDashboardData().subscribe((res) => {
      expect(res.mySubjects).toEqual(mockSubjects);
      expect(res.kardexHistory).toEqual(mockHistory);
      expect(res.userProfile).toEqual(mockProfile);
    });

    const reqSubjects = httpMock.expectOne(`${environment.apiBaseUrl}/enrollments/my-subjects`);
    const reqHistory = httpMock.expectOne(`${environment.apiBaseUrl}/enrollments/my-history`);
    const reqProfile = httpMock.expectOne(`${environment.apiBaseUrl}/auth/me`);

    reqSubjects.flush({ success: true, message: 'OK', data: mockSubjects });
    reqHistory.flush({ success: true, message: 'OK', data: mockHistory });
    reqProfile.flush({ success: true, message: 'OK', data: mockProfile });
  });

  it('should get student dashboard data', () => {
    const mockDashboard = { gpa: 95 } as any;
    service.getStudentDashboard().subscribe((res) => {
      expect(res).toEqual(mockDashboard);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/student`);
    req.flush({ success: true, message: 'OK', data: mockDashboard });
  });
});
