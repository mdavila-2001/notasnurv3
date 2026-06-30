import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

import { SubjectDetail } from './subject-detail';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { AttendanceService } from '../../services/attendance.service';
import { ReportService } from '../../services/report.service';

describe('SubjectDetail', () => {
  let component: SubjectDetail;
  let fixture: ComponentFixture<SubjectDetail>;
  let mockOperationalService: any;
  let mockToastService: any;
  let mockLocation: any;

  const mockSubjectData = {
    id: 1,
    name: 'Taller V',
    code: 'SIS-101',
    modality: 'FACE_TO_FACE'
  };

  beforeEach(async () => {
    mockOperationalService = {
      subject: signal(mockSubjectData),
      isLoading: signal(false),
      students: signal([]),
      evaluationPlan: signal({ id: 1, subjectId: 1, components: [] }),
      currentSubjectId: signal('1'),
      studentsLoading: signal(false),
      contextError: signal<string | null>(null),
      studentsError: signal<string | null>(null),
      loadSubjectContext: vi.fn(),
      clearContextError: vi.fn(),
      clearStudentsError: vi.fn(),
      clearStore: vi.fn()
    };

    mockToastService = {
      error: vi.fn()
    };

    mockLocation = {
      back: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SubjectDetail, HttpClientTestingModule],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: Location, useValue: mockLocation },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null)
              }
            }
          }
        }
      ]
    })
    .overrideComponent(SubjectDetail, {
      set: {
        providers: [
          { provide: SubjectOperationalService, useValue: mockOperationalService },
          EvaluationPlanService,
          AttendanceService,
          ReportService
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectDetail);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load subject context on init if id param is present', () => {
    fixture.detectChanges();
    expect(mockOperationalService.loadSubjectContext).toHaveBeenCalledWith('1');
  });

  it('should clear store on ngOnDestroy', () => {
    fixture.detectChanges();
    component.ngOnDestroy();
    expect(mockOperationalService.clearStore).toHaveBeenCalled();
  });

  it('should trigger location back on goBack()', () => {
    fixture.detectChanges();
    component.goBack();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('should render and change tabs correctly', () => {
    fixture.detectChanges();
    expect(component.activeTab()).toBe('students');

    component.activeTab.set('evaluation-plan');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('evaluation-plan');

    component.activeTab.set('reports');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('reports');
  });

  it('should show toast error and clear signal when contextError emits a value', () => {
    fixture.detectChanges();
    mockOperationalService.contextError.set('Context loading failed');
    fixture.detectChanges();

    expect(mockToastService.error).toHaveBeenCalledWith('Context loading failed', 'Carga de materia');
    expect(mockOperationalService.clearContextError).toHaveBeenCalled();
  });

  it('should show toast error and clear signal when studentsError emits a value', () => {
    fixture.detectChanges();
    mockOperationalService.studentsError.set('Students loading failed');
    fixture.detectChanges();

    expect(mockToastService.error).toHaveBeenCalledWith('Students loading failed', 'Carga de estudiantes');
    expect(mockOperationalService.clearStudentsError).toHaveBeenCalled();
  });
});
