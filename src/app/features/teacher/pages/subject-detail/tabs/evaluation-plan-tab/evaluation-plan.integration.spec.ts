import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EvaluationPlanTab } from './evaluation-plan-tab';
import { EvaluationPlanService } from '../../../../services/evaluation-plan.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { environment } from '../../../../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('EvaluationPlan Integration', () => {
  let fixture: ComponentFixture<EvaluationPlanTab>;
  let component: EvaluationPlanTab;
  let service: EvaluationPlanService;
  let operationalService: SubjectOperationalService;
  let toast: ToastService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationPlanTab],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EvaluationPlanService,
        SubjectOperationalService,
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            warning: vi.fn(),
            error: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationPlanTab);
    component = fixture.componentInstance;
    service = TestBed.inject(EvaluationPlanService);
    operationalService = TestBed.inject(SubjectOperationalService);
    toast = TestBed.inject(ToastService);
    httpMock = TestBed.inject(HttpTestingController);

    operationalService.setSubjectDirectly({
      id: 12,
      name: 'Estructuras de Datos I',
      code: 'INF-220',
      teacherName: 'MSc. Marcelo Dávila',
      recordStatus: 'OPEN',
      capacity: 30,
      semesterName: 'Semestre 1 - 2026'
    } as any);

    service.reset();
  });

  afterEach(() => {
    httpMock.verify();
    service.reset();
    TestBed.resetTestingModule();
  });

  it('should flow through fetching empty plan, creating it, adding components, and activating it', () => {
    service.fetchPlan('12').subscribe();

    fixture.detectChanges();

    const fetchReq = httpMock.expectOne(`${baseUrl}/evaluation-plans/subject/12`);
    expect(fetchReq.request.method).toBe('GET');
    fetchReq.flush({ success: false, data: null });

    fixture.detectChanges();
    expect(component.hasPlan()).toBe(false);

    component.handleCreate();
    
    const createReq = httpMock.expectOne(`${baseUrl}/evaluation-plans/subject/12`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush({
      success: true,
      data: {
        id: 101,
        subjectId: 12,
        components: []
      }
    });

    fixture.detectChanges();
    expect(component.hasPlan()).toBe(true);
    expect(component.componentsTotalWeight()).toBe(0);

    component.setNewName('Exámenes Parciales');
    component.setNewWeight(60);
    component.setNewDescription('Dos parciales de 30% cada uno');

    fixture.detectChanges();
    expect(component.isAddComponentDisabled()).toBe(false);

    component.handleAddComponent();

    const addComp1Req = httpMock.expectOne(`${baseUrl}/components`);
    expect(addComp1Req.request.method).toBe('POST');
    expect(addComp1Req.request.body).toEqual({
      name: 'Exámenes Parciales',
      weight: 60,
      description: 'Dos parciales de 30% cada uno',
      planId: 101
    });

    addComp1Req.flush({
      success: true,
      data: {
        id: 1,
        name: 'Exámenes Parciales',
        weight: 60,
        description: 'Dos parciales de 30% cada uno'
      }
    });

    fixture.detectChanges();
    expect(component.componentsTotalWeight()).toBe(60);
    expect(toast.success).toHaveBeenCalledWith('Componente agregado correctamente.', 'Componente creado');

    component.setNewName('Proyecto Final');
    component.setNewWeight(50);
    fixture.detectChanges();

    expect(component.isAddComponentDisabled()).toBe(true);

    component.setNewWeight(40);
    fixture.detectChanges();
    expect(component.isAddComponentDisabled()).toBe(false);

    component.handleAddComponent();

    const addComp2Req = httpMock.expectOne(`${baseUrl}/components`);
    addComp2Req.flush({
      success: true,
      data: {
        id: 2,
        name: 'Proyecto Final',
        weight: 40,
        description: ''
      }
    });

    fixture.detectChanges();
    expect(component.componentsTotalWeight()).toBe(100);
    expect(component.isComponentsWeightValid()).toBe(true);

    component.handleFinalizeConfiguration();

    const activateReq = httpMock.expectOne(`${baseUrl}/evaluation-plans/subject/12/activate`);
    expect(activateReq.request.method).toBe('POST');
    activateReq.flush({ success: true });

    fixture.detectChanges();
    expect(toast.success).toHaveBeenCalledWith('Configuración finalizada correctamente.', 'Plan finalizado');
  });
});
