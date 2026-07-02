import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';
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
      enrollStudent: vi.fn().mockReturnValue(of({ data: { studentName: 'Carlos Gómez' } })),
      withdrawStudent: vi.fn()
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
    expect(component.activeSubjects()).toEqual(mockSubjects);
  });

  it('should retrieve active academic records when a student is selected', () => {
    component.onStudentSelected('usr-1');
    expect(component.selectedUserId()).toBe('usr-1');
    expect(component.isDegreesLoading()).toBe(false);
    expect(mockEnrollmentApiService.getUserDegreesByUserId).toHaveBeenCalledWith('usr-1');
    
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
    const mockErrorResponse = {
      status: 409,
      error: {
        message: 'El estudiante ya se encuentra matriculado en esta materia.'
      }
    };
    mockEnrollmentApiService.enrollStudent.mockReturnValue(throwError(() => mockErrorResponse));

    component.selectedSubject.set(mockSubjects[0] as any);
    component.userDegreeId.set(45);

    component.confirmEnroll();

    expect(component.showToast()).toBe(true);
    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('El estudiante ya se encuentra matriculado en esta materia.');
  });

  it('should display error toast when student roster load fails', () => {
    mockAdminUserService.getByRole.mockReturnValue(throwError(() => new Error('Error')));
    component.loadInitialData();
    expect(component.showToast()).toBe(true);
    expect(component.toastMessage()).toBe('Error al cargar la nómina de estudiantes');
  });

  it('should display error toast when subjects load fails', () => {
    mockAdminSubjectService.getAll.mockReturnValue(throwError(() => new Error('Error')));
    component.loadInitialData();
    expect(component.showToast()).toBe(true);
    expect(component.toastMessage()).toBe('Error al cargar las materias');
  });

  it('should select subject and load enrolled students', () => {
    const mockStudentsEnrolled = [{ id: 'e1', studentId: 'usr-1', fullName: 'Carlos Gómez', ci: '1234567', email: 'carlos@nur.edu.bo', degreeName: 'Ingeniería de Sistemas' }];
    mockEnrollmentApiService.getStudentsBySubject.mockReturnValue(of({ data: mockStudentsEnrolled }));

    component.selectSubject(mockSubjects[0] as any);

    expect(component.selectedSubject()).toEqual(mockSubjects[0]);
    expect(mockEnrollmentApiService.getStudentsBySubject).toHaveBeenCalledWith('1');
    expect(component.enrolledStudents()).toEqual(mockStudentsEnrolled);
  });

  it('should display error toast when loading enrolled students fails', () => {
    mockEnrollmentApiService.getStudentsBySubject.mockReturnValue(throwError(() => new Error('Error')));
    component.loadEnrolledStudents('1');
    expect(component.showToast()).toBe(true);
    expect(component.toastMessage()).toBe('Error al cargar los alumnos matriculados');
  });

  it('should close enroll modal', () => {
    component.openEnrollModal();
    expect(component.isEnrollModalOpen()).toBe(true);
    component.closeEnrollModal();
    expect(component.isEnrollModalOpen()).toBe(false);
  });

  it('should not proceed with confirmEnroll if selectedSubject or userDegreeId is missing', () => {
    component.selectedSubject.set(null);
    component.userDegreeId.set(45);
    component.confirmEnroll();
    expect(component.showToast()).toBe(true);
    expect(component.toastMessage()).toBe('Por favor, selecciona un estudiante y su correspondiente carrera/expediente activo.');
    expect(mockEnrollmentApiService.enrollStudent).not.toHaveBeenCalled();

    component.showToast.set(false);
    component.selectedSubject.set(mockSubjects[0] as any);
    component.userDegreeId.set(null);
    component.confirmEnroll();
    expect(component.showToast()).toBe(true);
  });

  it('should extract error message correctly using extractErrorMessage', () => {
    component.selectedSubject.set(mockSubjects[0] as any);
    component.userDegreeId.set(45);

    mockEnrollmentApiService.enrollStudent.mockReturnValue(throwError(() => new Error('JS Error')));
    component.confirmEnroll();
    expect(component.toastMessage()).toBe('JS Error');

    mockEnrollmentApiService.enrollStudent.mockReturnValue(throwError(() => ({})));
    component.confirmEnroll();
    expect(component.toastMessage()).toBe('Error al realizar la matrícula');
  });

  it('should reset selection on student select with empty userId', () => {
    component.onStudentSelected('');
    expect(component.selectedUserId()).toBeNull();
    expect(component.userDegrees()).toEqual([]);
    expect(component.userDegreeId()).toBeNull();
    expect(component.degreesError()).toBe('');
  });

  it('should handle error when fetching user degrees fails', () => {
    mockEnrollmentApiService.getUserDegreesByUserId.mockReturnValue(throwError(() => new Error('Error')));
    component.onStudentSelected('usr-1');
    expect(component.degreesError()).toBe('Error al recuperar los expedientes académicos del estudiante.');
  });

  it('should not auto-select degree if multiple active records are returned', () => {
    const mockMultipleDegrees = [
      { id: 45, studentName: 'Carlos Gómez', degreeName: 'Ingeniería de Sistemas', status: 'ACTIVE' },
      { id: 46, studentName: 'Carlos Gómez', degreeName: 'Ingeniería Comercial', status: 'ACTIVE' }
    ];
    mockEnrollmentApiService.getUserDegreesByUserId.mockReturnValue(of({ data: mockMultipleDegrees }));
    component.onStudentSelected('usr-1');
    expect(component.userDegrees().length).toBe(2);
    expect(component.userDegreeId()).toBeNull();
  });

  it('should set userDegreeId on onUserDegreeSelected', () => {
    component.onUserDegreeSelected('99');
    expect(component.userDegreeId()).toBe(99);

    component.onUserDegreeSelected('');
    expect(component.userDegreeId()).toBeNull();
  });

  describe('withdraw flows', () => {
    it('should open withdraw modal correctly on openWithdrawModal', () => {
      component.openWithdrawModal('e123', 'Carlos Gómez');
      expect(component.pendingWithdrawEnrollmentId()).toBe('e123');
      expect(component.pendingWithdrawStudentName()).toBe('Carlos Gómez');
      expect(component.isWithdrawModalOpen()).toBe(true);
    });

    it('should fail openWithdrawModal if enrollmentId is missing', () => {
      component.openWithdrawModal(undefined, 'Carlos Gómez');
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('No se pudo identificar la matrícula para dar de baja');
    });

    it('should close withdraw modal correctly if not in withdrawing state', () => {
      component.openWithdrawModal('e123', 'Carlos Gómez');
      component.closeWithdrawModal();
      expect(component.isWithdrawModalOpen()).toBe(false);
      expect(component.pendingWithdrawEnrollmentId()).toBeNull();
    });

    it('should not close withdraw modal if currently withdrawing', () => {
      component.openWithdrawModal('e123', 'Carlos Gómez');
      component.isWithdrawing.set(true);
      component.closeWithdrawModal();
      expect(component.isWithdrawModalOpen()).toBe(true);
    });

    it('should fail confirmWithdraw if enrollmentId is missing', () => {
      component.pendingWithdrawEnrollmentId.set(null);
      component.confirmWithdraw();
      expect(component.showToast()).toBe(true);
    });

    it('should withdraw student successfully and reload lists', () => {
      component.openWithdrawModal('e123', 'Carlos Gómez');
      component.selectedSubject.set(mockSubjects[0] as any);
      mockEnrollmentApiService.withdrawStudent.mockReturnValue(of({}));
      const loadStudentsSpy = vi.spyOn(component, 'loadEnrolledStudents');
      const loadInitialSpy = vi.spyOn(component, 'loadInitialData');

      component.confirmWithdraw();

      expect(mockEnrollmentApiService.withdrawStudent).toHaveBeenCalledWith('e123');
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Carlos Gómez dado de baja correctamente');
      expect(component.toastType()).toBe('success');
      
      component.closeWithdrawModal();
      expect(component.isWithdrawModalOpen()).toBe(false);
      expect(loadStudentsSpy).toHaveBeenCalledWith('1');
      expect(loadInitialSpy).toHaveBeenCalled();
    });

    it('should display error toast on withdrawStudent failure', () => {
      mockEnrollmentApiService.withdrawStudent.mockReturnValue(throwError(() => new Error('Delete Fail')));
      component.withdrawStudent('e123', 'Carlos Gómez');
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Delete Fail');
    });

    it('should fail withdrawStudent if enrollmentId is undefined', () => {
      component.withdrawStudent(undefined, 'Carlos Gómez');
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('No se pudo identificar la matrícula para dar de baja');
    });
  });

  it('should close toast onToastClosed', () => {
    component.displayToast('Test Message', 'success');
    expect(component.showToast()).toBe(true);
    component.onToastClosed();
    expect(component.showToast()).toBe(false);
  });
});
