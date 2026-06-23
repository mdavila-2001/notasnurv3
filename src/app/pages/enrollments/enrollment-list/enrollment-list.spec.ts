import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EnrollmentListComponent } from './enrollment-list';
import { AdminSubjectService } from '../../../features/admin/services/admin-subject.service';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';
import { AdminUserService } from '../../../features/admin/services/admin-user.service';

describe('EnrollmentListComponent', () => {
  let component: EnrollmentListComponent;
  let fixture: ComponentFixture<EnrollmentListComponent>;
  let mockAdminSubjectService: any;
  let mockEnrollmentApiService: any;
  let mockAdminUserService: any;

  const mockSubjects = [
    { id: '1', name: 'Matemáticas', code: 'MAT-101', recordStatus: 'PUBLISHED', capacity: 20 }
  ];

  const mockStudents = [
    { id: 'usr-1', fullName: 'Carlos Gómez', ci: '1234567', role: 'STUDENT', status: 'ACTIVE' }
  ];

  const mockUserDegrees = [
    { id: 45, studentName: 'Carlos Gómez', degreeName: 'Ingeniería de Sistemas', status: 'ACTIVE' }
  ];

  beforeEach(async () => {
    mockAdminSubjectService = {
      getAll: vi.fn().mockReturnValue(of({ data: mockSubjects }))
    };

    mockEnrollmentApiService = {
      getStudentsBySubject: vi.fn().mockReturnValue(of({ data: [] })),
      getUserDegreesByUserId: vi.fn().mockReturnValue(of({ data: mockUserDegrees })),
      enrollStudent: vi.fn().mockReturnValue(of({ data: { studentName: 'Carlos Gómez' } }))
    };

    mockAdminUserService = {
      getByRole: vi.fn().mockReturnValue(of({ data: mockStudents }))
    };

    await TestBed.configureTestingModule({
      imports: [EnrollmentListComponent, HttpClientTestingModule],
      providers: [
        { provide: AdminSubjectService, useValue: mockAdminSubjectService },
        { provide: EnrollmentApiService, useValue: mockEnrollmentApiService },
        { provide: AdminUserService, useValue: mockAdminUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnrollmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load subjects and student directory on init', () => {
    expect(mockAdminSubjectService.getAll).toHaveBeenCalled();
    expect(mockAdminUserService.getByRole).toHaveBeenCalledWith('STUDENT');
    expect(component.subjects().length).toBe(1);
    expect(component.studentsList().length).toBe(1);
  });

  it('should retrieve active academic records when a student is selected', () => {
    component.onStudentSelected('usr-1');
    expect(component.selectedUserId()).toBe('usr-1');
    expect(component.isDegreesLoading()).toBe(false);
    expect(mockEnrollmentApiService.getUserDegreesByUserId).toHaveBeenCalledWith('usr-1');
    
    // Carlos Gómez only has 1 active degree, so it should auto-select
    expect(component.userDegrees().length).toBe(1);
    expect(component.userDegreeId()).toBe(45);
  });

  it('should show error message if student has no active academic records', () => {
    mockEnrollmentApiService.getUserDegreesByUserId.mockReturnValue(of({ data: [] }));
    component.onStudentSelected('usr-1');
    expect(component.userDegrees().length).toBe(0);
    expect(component.userDegreeId()).toBeNull();
    expect(component.degreesError()).toBe('Este estudiante no cuenta con un expediente académico activo en ninguna carrera.');
  });

  it('should open and reset enroll modal', () => {
    component.openEnrollModal();
    expect(component.isEnrollModalOpen()).toBe(true);
    expect(component.userDegreeId()).toBeNull();
    expect(component.selectedUserId()).toBeNull();
    expect(component.userDegrees().length).toBe(0);
  });

  it('should matriculate student correctly on confirm', () => {
    component.selectedSubject.set(mockSubjects[0] as any);
    component.userDegreeId.set(45);
    
    component.confirmEnroll();
    expect(mockEnrollmentApiService.enrollStudent).toHaveBeenCalledWith({
      userDegreeId: 45,
      subjectId: 1
    });
    expect(component.isEnrollModalOpen()).toBe(false);
  });

  it('should display error toast when enrollment fails due to duplicity (Req 3)', () => {
    // Mock the backend API error response for duplicity
    const mockErrorResponse = {
      status: 409,
      error: {
        message: 'El estudiante ya se encuentra matriculado en esta materia.'
      }
    };
    mockEnrollmentApiService.enrollStudent.mockReturnValue(throwError(() => mockErrorResponse));

    component.selectedSubject.set(mockSubjects[0] as any);
    component.userDegreeId.set(45);

    // Call confirmEnroll which will fail with the mock error
    component.confirmEnroll();

    // Verify error toast display
    expect(component.showToast()).toBe(true);
    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('El estudiante ya se encuentra matriculado en esta materia.');
  });
});
