import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TeacherService, TeacherDashboardData } from './teacher.service';
import { ApiService } from '../../../core/services/api.service';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { SubjectResponse } from '../../admin/services/admin-subject.service';

describe('TeacherService', () => {
  let service: TeacherService;
  let httpMock: HttpTestingController;

  const mockDashboard: TeacherDashboardData = {
    welcomeMessage: 'Welcome Orlando',
    pendingActasCount: 2,
    averageCourseGrade: 78.4,
    subjects: []
  };

  const mockSubject: SubjectResponse = {
    id: 'subj-123',
    code: 'INF-320',
    name: 'Mobile Programming II',
    modality: 'FACE_TO_FACE',
    capacity: 40,
    semesterId: '1',
    teacherId: 'teacher-456',
    teacherName: 'Orlando Almagro',
    semesterName: '1-2026',
    recordStatus: 'ACTIVE',
    management: '2026'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeacherService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TeacherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch teacher dashboard data', () => {
    const mockResponse = { success: true, message: 'Ok', data: mockDashboard };
    service.getDashboard().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/dashboard/teacher');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch teacher subjects raw array', () => {
    const mockRawArray = [mockSubject];
    service.getMySubjects().subscribe((res) => {
      expect(res).toEqual(mockRawArray);
    });

    const req = httpMock.expectOne('/api/subjects/my-subjects');
    expect(req.request.method).toBe('GET');
    req.flush(mockRawArray);
  });
});
