import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GradeService } from './grade.service';
import { EvaluationPlanService } from './evaluation-plan.service';
import { EnrollmentApiService, StudentEnrolledResponse } from './enrollment-api.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';

describe('GradeService', () => {
  let service: GradeService;
  let httpMock: HttpTestingController;
  let enrollmentApi: EnrollmentApiService;
  let evalPlanService: EvaluationPlanService;
  let operationalService: SubjectOperationalService;

  const mockStudents: StudentEnrolledResponse[] = [
    { id: 'stu-1', studentId: 'stu-1', fullName: 'Alice', ci: '123', email: 'a@test.com', degreeName: 'Ing.' },
    { id: 'stu-2', studentId: 'stu-2', fullName: 'Bob', ci: '456', email: 'b@test.com', degreeName: 'Lic.' },
  ];

  const mockComponents = [
    { id: 1, name: 'Parcial 1', weight: 30, description: 'Primer parcial' },
    { id: 2, name: 'Parcial 2', weight: 30, description: 'Segundo parcial' },
    { id: 3, name: 'Prácticas', weight: 40, description: '' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GradeService,
        EvaluationPlanService,
        EnrollmentApiService,
        SubjectOperationalService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GradeService);
    httpMock = TestBed.inject(HttpTestingController);
    enrollmentApi = TestBed.inject(EnrollmentApiService);
    evalPlanService = TestBed.inject(EvaluationPlanService);
    operationalService = TestBed.inject(SubjectOperationalService);
    service.reset();
  });

  afterEach(() => {
    httpMock.verify();
    service.reset();
  });

  describe('reactive data loading via context services', () => {
    it('should reactively expose students and components from operational services', () => {
      evalPlanService['_plan'].set({ id: 1, subjectId: 10, components: mockComponents });
      operationalService['_students'].set(mockStudents as any);

      TestBed.flushEffects();

      expect(service.students().length).toBe(2);
      expect(service.components().length).toBe(3);
      expect(service.selectedComponentId()).toBe(1); // Auto-selected first component by effect
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('selectComponent', () => {
    it('should update selected component', () => {
      evalPlanService['_plan'].set({ id: 1, subjectId: 10, components: mockComponents });
      service.selectComponent(2);
      expect(service.selectedComponentId()).toBe(2);
      expect(service.selectedComponent()?.name).toBe('Parcial 2');
    });
  });

  describe('updateGrade / getGrade', () => {
    beforeEach(() => {
      evalPlanService['_plan'].set({ id: 1, subjectId: 10, components: mockComponents });
      service.selectComponent(1);
    });

    it('should store grade locally', () => {
      service.updateGrade('stu-1', 25);
      expect(service.getGrade('stu-1')).toBe(25);
    });

    it('should clamp grade between 0 and 100', () => {
      service.updateGrade('stu-1', 150);
      expect(service.getGrade('stu-1')).toBe(100);
      service.updateGrade('stu-1', -10);
      expect(service.getGrade('stu-1')).toBe(0);
    });

    it('should clear grade when setting null', () => {
      service.updateGrade('stu-1', 25);
      service.updateGrade('stu-1', null);
      expect(service.getGrade('stu-1')).toBeNull();
    });

    it('should store different grades per component', () => {
      service.updateGrade('stu-1', 25);
      service.selectComponent(2);
      service.updateGrade('stu-1', 20);
      expect(service.getGrade('stu-1')).toBe(20);
      service.selectComponent(1);
      expect(service.getGrade('stu-1')).toBe(25);
    });
  });

  describe('studentRows', () => {
    beforeEach(() => {
      operationalService['_students'].set(mockStudents as any);
      evalPlanService['_plan'].set({ id: 1, subjectId: 10, components: mockComponents });
      service.selectComponent(1);
    });

    it('should return rows for all students', () => {
      const rows = service.studentRows();
      expect(rows.length).toBe(2);
      expect(rows[0].fullName).toBe('Alice');
      expect(rows[1].fullName).toBe('Bob');
    });

    it('should reflect updated grades', () => {
      service.updateGrade('stu-1', 25);
      const rows = service.studentRows();
      expect(rows[0].score).toBe(25);
      expect(rows[1].score).toBeNull();
    });

    it('should recompute gradedCount and completionPercentage', () => {
      expect(service.gradedCount()).toBe(0);
      expect(service.completionPercentage()).toBe(0);
      service.updateGrade('stu-1', 25);
      expect(service.gradedCount()).toBe(1);
      expect(service.completionPercentage()).toBe(50);
    });
  });

  describe('saveGrade', () => {
    beforeEach(() => {
      evalPlanService['_plan'].set({ id: 1, subjectId: 10, components: mockComponents });
      operationalService.setStudentsDirectly([
        { studentId: 'stu-1', enrollmentId: 'enr-1', fullName: 'Alice', ci: '123', email: 'a@test.com', degreeName: 'Ing.' },
        { studentId: 'stu-2', enrollmentId: 'enr-2', fullName: 'Bob', ci: '456', email: 'b@test.com', degreeName: 'Lic.' },
      ]);
      service.selectComponent(1);
    });

    it('should POST grade and update status', () => {
      service.updateGrade('stu-1', 25);
      let success = false;
      service.saveGrade('stu-1').subscribe(r => { success = r; });

      const req = httpMock.expectOne('/api/grades');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ enrollmentId: 'enr-1', componentId: 1, score: 25 });
      req.flush({ success: true, message: 'Guardado', data: { id: 'g-1', enrollmentId: 'enr-1', componentId: 1, score: 25 } });

      expect(success).toBe(true);
      const rows = service.studentRows();
      const alice = rows.find(r => r.studentId === 'stu-1');
      expect(alice?.status).toBe('saved');
    });

    it('should handle save error', () => {
      service.updateGrade('stu-1', 25);
      let success = true;
      service.saveGrade('stu-1').subscribe(r => { success = r; });

      const req = httpMock.expectOne('/api/grades');
      req.flush({ success: false, message: 'La nota excede el peso del componente', data: null }, { status: 400, statusText: 'Bad Request' });

      expect(success).toBe(false);
      expect(service.error()).toBeTruthy();
    });

    it('should return false if no grade set', () => {
      let result: boolean | undefined;
      service.saveGrade('stu-1').subscribe(r => { result = r; });
      expect(result).toBe(false);
    });

    it('should return false if the enrollment id is unavailable', () => {
      operationalService.setStudentsDirectly([
        { studentId: 'stu-1', fullName: 'Alice', ci: '123', email: 'a@test.com', degreeName: 'Ing.' },
      ]);

      service.updateGrade('stu-1', 25);

      let result: boolean | undefined;
      service.saveGrade('stu-1').subscribe(r => { result = r; });

      httpMock.expectNone('/api/grades');
      expect(result).toBe(false);
      expect(service.error()).toBe('No se encontró la inscripción del estudiante.');
    });
  });
});
