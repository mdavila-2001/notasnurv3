import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EnrollmentApiService, EnrollmentRequest, EnrollmentResponse, MySubjectResponse } from './enrollment-api.service';
import { ApiService } from '../../../core/services/api.service';
import { StudentEnrolledResponse } from '../../../core/models/enrollment.model';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('EnrollmentApiService', () => {
  let service: EnrollmentApiService;
  let httpMock: HttpTestingController;

  const mockStudentEnrolled: StudentEnrolledResponse = {
    id: 'enroll-123',
    studentId: 'student-456',
    fullName: 'Maria Estudiante',
    ci: '77788899',
    email: 'm.estudiante@nur.edu.bo',
    degreeName: 'Ingeniería de Sistemas'
  };

  const mockMySubject: MySubjectResponse = {
    subjectCode: 'INF-320',
    subjectName: 'Mobile Programming II',
    teacherName: 'Orlando Almagro',
    degreeName: 'Ingeniería de Sistemas'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EnrollmentApiService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EnrollmentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch students by subject id', () => {
    const mockResponse = { success: true, message: 'Ok', data: [mockStudentEnrolled] };
    service.getStudentsBySubject('subj-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/enrollments/subjects/subj-123/students');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch my subjects', () => {
    const mockResponse = { success: true, message: 'Ok', data: [mockMySubject] };
    service.getMySubjects().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/enrollments/my-subjects');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should enroll a student', () => {
    const requestPayload: EnrollmentRequest = {
      userDegreeId: 42,
      subjectId: 101
    };
    const mockEnrollmentResponse: EnrollmentResponse = {
      id: 'enroll-123',
      studentName: 'Maria Estudiante',
      studentCi: '77788899',
      subjectCode: 'INF-320',
      subjectName: 'Mobile Programming II',
      enrolledAt: '2026-06-23T12:00:00'
    };
    const mockResponse = { success: true, message: 'Ok', data: mockEnrollmentResponse };

    service.enrollStudent(requestPayload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/enrollments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestPayload);
    req.flush(mockResponse);
  });

  it('should withdraw a student from enrollment', () => {
    const mockResponse = { success: true, message: 'Withdrawn', data: null as any };
    service.withdrawStudent('enroll-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/enrollments/enroll-123');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should get user degrees by user id', () => {
    const mockUserDegrees = [{ id: 42, degreeName: 'Ingeniería de Sistemas' }];
    const mockResponse = { success: true, message: 'Ok', data: mockUserDegrees };
    service.getUserDegreesByUserId('user-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/user-degrees/user/user-123');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
