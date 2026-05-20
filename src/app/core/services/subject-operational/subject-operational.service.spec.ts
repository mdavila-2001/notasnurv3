import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';

import { SubjectOperationalService } from './subject-operational.service';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';
import { EvaluationPlanService } from '../../../features/teacher/services/evaluation-plan.service';
import { AdminSubjectService } from '../../../features/admin/services/admin-subject.service';

describe('SubjectOperationalService', () => {
  let service: SubjectOperationalService;
  let enrollmentApiSpy: jasmine.SpyObj<EnrollmentApiService>;
  let evaluationPlanSpy: jasmine.SpyObj<EvaluationPlanService>;
  let adminSubjectSpy: jasmine.SpyObj<AdminSubjectService>;

  beforeEach(() => {
    enrollmentApiSpy = jasmine.createSpyObj<EnrollmentApiService>('EnrollmentApiService', ['getStudentsBySubject']);
    evaluationPlanSpy = jasmine.createSpyObj<EvaluationPlanService>('EvaluationPlanService', ['fetchPlan', 'reset'], {
      plan: () => null,
    });
    adminSubjectSpy = jasmine.createSpyObj<AdminSubjectService>('AdminSubjectService', ['getById']);

    enrollmentApiSpy.getStudentsBySubject.and.returnValue(of({ data: [] }));
    evaluationPlanSpy.fetchPlan.and.returnValue(of({ data: null }));
    adminSubjectSpy.getById.and.returnValue(of({ data: null }));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnrollmentApiService, useValue: enrollmentApiSpy },
        { provide: EvaluationPlanService, useValue: evaluationPlanSpy },
        { provide: AdminSubjectService, useValue: adminSubjectSpy },
      ],
    });
    service = TestBed.inject(SubjectOperationalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('does not cache students load when request fails', async () => {
    enrollmentApiSpy.getStudentsBySubject.and.returnValue(throwError(() => new Error('network error')));

    await service.loadStudents('S-101');
    await service.loadStudents('S-101');

    expect(enrollmentApiSpy.getStudentsBySubject).toHaveBeenCalledTimes(2);
  });

  it('keeps isLoading true until students request finishes in loadSubjectContext', async () => {
    const studentsResponse$ = new Subject<{ data: [] }>();
    enrollmentApiSpy.getStudentsBySubject.and.returnValue(studentsResponse$.asObservable());
    evaluationPlanSpy.fetchPlan.and.returnValue(of({ data: null }));
    adminSubjectSpy.getById.and.returnValue(of({ data: null }));

    service.loadSubjectContext('S-102');
    await Promise.resolve();

    expect(service.isLoading()).toBeTrue();

    studentsResponse$.next({ data: [] });
    studentsResponse$.complete();
    await Promise.resolve();

    expect(service.isLoading()).toBeFalse();
  });
});
