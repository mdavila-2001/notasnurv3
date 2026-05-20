import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EvaluationPlanService, EvaluationPlanResponse, ComponentResponse } from './evaluation-plan.service';

describe('EvaluationPlanService', () => {
  let service: EvaluationPlanService;
  let httpMock: HttpTestingController;

  const mockPlan: EvaluationPlanResponse = {
    id: 1,
    subjectId: 10,
    components: [
      { id: 1, name: 'Parcial 1', weight: 30, description: 'Primer examen parcial' },
      { id: 2, name: 'Parcial 2', weight: 30, description: 'Segundo examen parcial' },
      { id: 3, name: 'Prácticas', weight: 40, description: 'Laboratorios y prácticas' },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EvaluationPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EvaluationPlanService);
    httpMock = TestBed.inject(HttpTestingController);
    service.reset();
  });

  afterEach(() => {
    httpMock.verify();
    service.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchPlan', () => {
    it('should load plan and update signals', () => {
      service.fetchPlan('10').subscribe(plan => {
        expect(plan).toEqual(mockPlan);
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: 'Plan obtenido', data: mockPlan });

      expect(service.hasPlan()).toBeTrue();
      expect(service.weightSum()).toBe(100);
      expect(service.canActivate()).toBeTrue();
      expect(service.components().length).toBe(3);
    });

    it('should handle 404 (no plan) gracefully', () => {
      service.fetchPlan('10').subscribe(plan => {
        expect(plan).toBeNull();
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({ success: false, message: 'Plan no encontrado', data: null }, { status: 404, statusText: 'Not Found' });

      expect(service.hasPlan()).toBeFalse();
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('createPlan', () => {
    it('should create plan and update signals', () => {
      service.createPlan('10').subscribe(plan => {
        expect(plan).toEqual(mockPlan);
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Plan creado', data: mockPlan });

      expect(service.hasPlan()).toBeTrue();
    });

    it('should set error on failure', () => {
      service.createPlan('10').subscribe(plan => {
        expect(plan).toBeNull();
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({ success: false, message: 'Error al crear', data: null }, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBeTruthy();
    });
  });

  describe('addComponent', () => {
    it('should add component to existing plan', () => {
      service['_plan'].set(mockPlan);
      const newComponent: ComponentResponse = { id: 4, name: 'Final', weight: 10, description: '' };
      const componentCount = service.components().length;

      service.addComponent({ name: 'Final', weight: 10, description: '', planId: 1 }).subscribe(component => {
        expect(component).toEqual(newComponent);
      });

      const req = httpMock.expectOne('/api/components');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Final', weight: 10, description: '', planId: 1 });
      req.flush({ success: true, message: 'Componente registrado', data: newComponent });

      expect(service.components().length).toBe(componentCount + 1);
    });
  });

  describe('deleteComponent', () => {
    it('should remove component from plan', () => {
      service['_plan'].set(mockPlan);
      const componentCount = service.components().length;

      service.deleteComponent(1).subscribe(success => {
        expect(success).toBeTrue();
      });

      const req = httpMock.expectOne('/api/components/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Componente eliminado', data: null });

      expect(service.components().length).toBe(componentCount - 1);
    });
  });

  describe('weightSum / canActivate', () => {
    it('should compute weightSum correctly', () => {
      service['_plan'].set(mockPlan);
      expect(service.weightSum()).toBe(100);
      expect(service.canActivate()).toBeTrue();
    });

    it('should not activate when sum is not 100', () => {
      service['_plan'].set({
        ...mockPlan,
        components: [
          { id: 1, name: 'Parcial 1', weight: 50, description: '' },
        ],
      });
      expect(service.weightSum()).toBe(50);
      expect(service.canActivate()).toBeFalse();
    });

    it('should return 0 for empty plan', () => {
      service['_plan'].set({ ...mockPlan, components: [] });
      expect(service.weightSum()).toBe(0);
      expect(service.canActivate()).toBeFalse();
    });
  });

  describe('activatePlan', () => {
    it('should activate plan successfully', () => {
      service.activatePlan('10').subscribe(success => {
        expect(success).toBeTrue();
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10/activate');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Plan activado', data: null });
    });

    it('should set error on activation failure', () => {
      service.activatePlan('10').subscribe(success => {
        expect(success).toBeFalse();
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10/activate');
      req.flush({ success: false, message: 'La suma de pesos debe ser 100', data: null }, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toContain('100');
    });
  });
});
