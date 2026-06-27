import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EnrollmentListComponent } from './enrollment-list';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';
import { AdminSubjectService } from '../../../features/admin/services/admin-subject.service';
import { AdminUserService } from '../../../features/admin/services/admin-user.service';
import { environment } from '../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('EnrollmentList Integration', () => {
  let fixture: ComponentFixture<EnrollmentListComponent>;
  let component: EnrollmentListComponent;
  let httpMock: HttpTestingController;
  let mockRouter: any;
  const baseUrl = environment.apiBaseUrl;

  const mockSubjects = [
    { id: '10', name: 'Álgebra Lineal', code: 'MAT-101', recordStatus: 'PUBLISHED', capacity: 20 }
  ];

  const mockStudentsList = [
    { id: 'usr-student-1', fullName: 'Carlos Gómez', ci: '1234567', role: 'STUDENT', status: 'ACTIVE' }
  ];

  const mockDegrees = [
    { id: 45, degreeName: 'Ingeniería de Sistemas', status: 'ACTIVE' }
  ];

  beforeEach(async () => {
    mockRouter = {
      url: '/admin/enrollments',
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [EnrollmentListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EnrollmentApiService, // Real service
        AdminSubjectService,  // Real service
        AdminUserService,     // Real service
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnrollmentListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should initialize component, fetch subjects and students, and perform a full enrollment flow', () => {
    // 1. Trigger initial data load on init
    fixture.detectChanges();

    // 2. Expect and mock the HTTP calls triggered by AdminSubjectService.getAll and AdminUserService.getByRole
    const subjectsReq = httpMock.expectOne(`${baseUrl}/subjects`);
    expect(subjectsReq.request.method).toBe('GET');
    subjectsReq.flush({ success: true, message: '', data: mockSubjects });

    const studentsReq = httpMock.expectOne(`${baseUrl}/users?role=STUDENT`);
    expect(studentsReq.request.method).toBe('GET');
    studentsReq.flush({ success: true, message: '', data: mockStudentsList });

    fixture.detectChanges();

    expect(component.subjects().length).toBe(1);
    expect(component.studentsList().length).toBe(1);

    // 3. Select a subject and expect the HTTP request for enrolled students
    component.selectSubject(mockSubjects[0] as any);
    
    const enrolledReq = httpMock.expectOne(`${baseUrl}/enrollments/subjects/10/students`);
    expect(enrolledReq.request.method).toBe('GET');
    enrolledReq.flush({ success: true, message: '', data: [] });

    fixture.detectChanges();
    expect(component.enrolledStudents().length).toBe(0);

    // 4. Open the enroll modal
    component.openEnrollModal();
    expect(component.isEnrollModalOpen()).toBe(true);

    // 5. Select a student and expect the HTTP request for the student's active degrees
    component.onStudentSelected('usr-student-1');
    expect(component.selectedUserId()).toBe('usr-student-1');

    const degreesReq = httpMock.expectOne(`${baseUrl}/user-degrees/user/usr-student-1`);
    expect(degreesReq.request.method).toBe('GET');
    degreesReq.flush({ success: true, message: '', data: mockDegrees });

    fixture.detectChanges();
    // Verify auto-selection of the single active degree
    expect(component.userDegreeId()).toBe(45);

    // 6. Confirm enrollment and expect the HTTP POST request to enroll
    component.confirmEnroll();

    const postEnrollReq = httpMock.expectOne(`${baseUrl}/enrollments`);
    expect(postEnrollReq.request.method).toBe('POST');
    expect(postEnrollReq.request.body).toEqual({
      userDegreeId: 45,
      subjectId: 10
    });
    
    postEnrollReq.flush({
      success: true,
      message: 'Matrícula exitosa',
      data: {
        id: 'enroll-1',
        studentName: 'Carlos Gómez',
        studentCi: '1234567',
        subjectCode: 'MAT-101',
        subjectName: 'Álgebra Lineal',
        enrolledAt: '2026-06-24T00:00:00'
      }
    });

    // 7. Flow triggers reloads: one for enrolled students list and one for catalog (subjects)
    const reloadEnrolledReq = httpMock.expectOne(`${baseUrl}/enrollments/subjects/10/students`);
    reloadEnrolledReq.flush({
      success: true,
      data: [
        {
          id: 'enroll-1',
          studentId: 'usr-student-1',
          fullName: 'Carlos Gómez',
          ci: '1234567',
          email: 'carlos@nur.edu',
          degreeName: 'Ingeniería de Sistemas'
        }
      ]
    });

    const reloadSubjectsReq = httpMock.expectOne(`${baseUrl}/subjects`);
    reloadSubjectsReq.flush({ success: true, data: mockSubjects });

    const reloadStudentsReq = httpMock.expectOne(`${baseUrl}/users?role=STUDENT`);
    reloadStudentsReq.flush({ success: true, data: mockStudentsList });

    fixture.detectChanges();

    // 8. Assertions
    expect(component.isEnrollModalOpen()).toBe(false);
    expect(component.enrolledStudents().length).toBe(1);
    expect(component.enrolledStudents()[0].fullName).toBe('Carlos Gómez');
    expect(component.showToast()).toBe(true);
    expect(component.toastType()).toBe('success');
    expect(component.toastMessage()).toBe('Carlos Gómez matriculado con éxito en Álgebra Lineal');
  });
});
