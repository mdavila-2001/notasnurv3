import { TestBed } from '@angular/core/testing';
import { SubjectOperationalService } from './subject-operational.service';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';
import { EvaluationPlanService } from '../../../features/teacher/services/evaluation-plan.service';
import { AdminSubjectService } from '../../../features/admin/services/admin-subject.service';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { signal } from '@angular/core';

describe('SubjectOperationalService', () => {
  let service: SubjectOperationalService;
  let mockEnrollmentService: any;
  let mockEvaluationService: any;
  let mockAdminSubjectService: any;

  const mockSubject = {
    id: '1',
    code: 'INF-320',
    name: 'Mobile II',
    modality: 'FACE_TO_FACE',
    capacity: 40,
    semesterId: '1',
    teacherId: 'teacher-1'
  } as any;

  const mockStudentsList = [
    {
      studentId: 'stud-1',
      id: 'stud-1',
      enrollmentId: 'enroll-1',
      fullName: 'Juan Perez',
      ci: '123',
      email: 'juan@test.com',
      degreeName: 'Sistemas'
    }
  ];

  beforeEach(() => {
    mockEnrollmentService = {
      getStudentsBySubject: vi.fn().mockReturnValue(of({ success: true, data: mockStudentsList }))
    };

    mockEvaluationService = {
      plan: signal(null),
      fetchPlan: vi.fn().mockReturnValue(of({ id: 10, subjectId: 1, components: [] })),
      reset: vi.fn()
    };

    mockAdminSubjectService = {
      getById: vi.fn().mockReturnValue(of({ success: true, data: mockSubject }))
    };

    TestBed.configureTestingModule({
      providers: [
        SubjectOperationalService,
        { provide: EnrollmentApiService, useValue: mockEnrollmentService },
        { provide: EvaluationPlanService, useValue: mockEvaluationService },
        { provide: AdminSubjectService, useValue: mockAdminSubjectService }
      ]
    });

    service = TestBed.inject(SubjectOperationalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set subject directly', () => {
    service.setSubjectDirectly(mockSubject);
    expect(service.subject()).toEqual(mockSubject);
    expect(service.currentSubjectId()).toBe('1');
  });

  it('should clear store and reset services', () => {
    service.setSubjectDirectly(mockSubject);
    service.clearStore();
    expect(service.subject()).toBeNull();
    expect(mockEvaluationService.reset).toHaveBeenCalled();
  });

  it('should load subject context successfully when subject needs to be loaded', () => {
    service.loadSubjectContext('1');

    expect(mockAdminSubjectService.getById).toHaveBeenCalledWith('1');
    expect(mockEvaluationService.fetchPlan).toHaveBeenCalledWith('1');
    expect(service.subject()).toEqual(mockSubject);
    expect(service.contextError()).toBeNull();
  });

  it('should load subject context with alternative response wrapper structure (direct object)', () => {
    mockAdminSubjectService.getById.mockReturnValue(of(mockSubject)); // no 'data' wrapper
    service.loadSubjectContext('1');
    expect(service.subject()).toEqual(mockSubject);
  });

  it('should load subject context with invalid response structure', () => {
    mockAdminSubjectService.getById.mockReturnValue(of({} as any)); 
    service.loadSubjectContext('1');
    expect(service.subject()).toBeNull();
  });

  it('should handle loadSubjectContext API errors for subject details', () => {
    mockAdminSubjectService.getById.mockReturnValue(throwError(() => new Error('Subject Load Error')));
    service.loadSubjectContext('1');
    expect(service.contextError()).toBe('No se pudo cargar la materia de esta pantalla.');
  });

  it('should handle loadSubjectContext API errors for evaluation plan', () => {
    mockEvaluationService.fetchPlan.mockReturnValue(throwError(() => new Error('Plan Load Error')));
    service.loadSubjectContext('1');
    expect(service.contextError()).toBe('No se pudo cargar el plan de evaluación.');
  });

  it('should clear errors', () => {
    service.clearContextError();
    expect(service.contextError()).toBeNull();
    
    service.clearStudentsError();
    expect(service.studentsError()).toBeNull();
  });

  describe('loadStudents', () => {
    it('should clear list if subjectId is empty', async () => {
      service.setStudentsDirectly([{ studentId: '1' } as any]);
      await service.loadStudents('');
      expect(service.students()).toEqual([]);
      expect(service.studentsError()).toBeNull();
    });

    it('should fetch and map students successfully', async () => {
      await service.loadStudents('1');
      expect(mockEnrollmentService.getStudentsBySubject).toHaveBeenCalledWith('1');
      expect(service.students().length).toBe(1);
      expect(service.students()[0].fullName).toBe('Juan Perez');
      expect(service.studentsError()).toBeNull();
    });

    it('should handle api error and set studentsError', async () => {
      mockEnrollmentService.getStudentsBySubject.mockReturnValue(throwError(() => new Error('Load failed')));
      await service.loadStudents('1');
      expect(service.students()).toEqual([]);
      expect(service.studentsError()).toBe('No se pudieron cargar los estudiantes de esta materia.');
    });

    it('should prevent concurrent overlapping requests for same subject', () => {
      mockEnrollmentService.getStudentsBySubject.mockReturnValue(of({ success: true, data: mockStudentsList }));
      
      // Start loading
      service.loadStudents('1');
      
      // Subsequent call while loading should resolve immediately without re-calling api
      service.loadStudents('1');
      expect(mockEnrollmentService.getStudentsBySubject).toHaveBeenCalledTimes(1);
    });
  });
});
