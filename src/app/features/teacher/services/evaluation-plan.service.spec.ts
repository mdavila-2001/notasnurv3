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

      expect(service.hasPlan()).toBe(true);
      expect(service.componentsTotalWeight()).toBe(100);
      expect(service.canActivate()).toBe(true);
      expect(service.components().length).toBe(3);
    });

    it('should use cache on subsequent fetchPlan calls', () => {
      service.fetchPlan('10').subscribe();
      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({ success: true, message: 'Plan obtenido', data: mockPlan });

      service.fetchPlan('10').subscribe(plan => {
        expect(plan).toEqual(mockPlan);
      });
      httpMock.expectNone('/api/evaluation-plans/subject/10');
    });

    it('should handle 404 (no plan) gracefully', () => {
      service.fetchPlan('10').subscribe(plan => {
        expect(plan).toBeNull();
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({ success: false, message: 'Plan no encontrado', data: null }, { status: 404, statusText: 'Not Found' });

      expect(service.hasPlan()).toBe(false);
      expect(service.isLoading()).toBe(false);
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

      expect(service.hasPlan()).toBe(true);
    });

    it('should set error on failure', () => {
      service.createPlan('10').subscribe(plan => {
        expect(plan).toBeNull();
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({ success: false, message: 'Error al crear', data: null }, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBeTruthy();
    });

    it('should use default error message on failure if payload is empty', () => {
      service.createPlan('10').subscribe();
      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBe('Error al crear el plan de evaluación');
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
      req.flush({ success: true, message: 'Componente registrado', data: newComponent });

      expect(service.components().length).toBe(componentCount + 1);
    });

    it('should ignore if component response is empty', () => {
      service['_plan'].set(mockPlan);
      const componentCount = service.components().length;

      service.addComponent({ name: 'Final', weight: 10, description: '', planId: 1 }).subscribe(component => {
        expect(component).toBeNull();
      });

      const req = httpMock.expectOne('/api/components');
      req.flush({ success: true, message: 'Vacío', data: null });

      expect(service.components().length).toBe(componentCount);
    });

    it('should handle addComponent failure', () => {
      service.addComponent({ name: 'Final', weight: 10, description: '', planId: 1 }).subscribe();
      const req = httpMock.expectOne('/api/components');
      req.flush({ success: false, message: 'Add component failed' }, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toBe('Add component failed');
    });
  });

  describe('updateComponent', () => {
    it('should update component in existing plan', () => {
      service['_plan'].set(mockPlan);
      const updated: ComponentResponse = { id: 2, name: 'Parcial 2 Modificado', weight: 35, description: 'Desglose modificado' };

      service.updateComponent(2, { name: 'Parcial 2 Modificado', weight: 35, description: 'Desglose modificado' }).subscribe(res => {
        expect(res).toEqual(updated);
      });

      const req = httpMock.expectOne('/api/components/2');
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, message: 'Componente actualizado', data: updated });

      const componentInState = service.components().find(c => c.id === 2);
      expect(componentInState?.name).toBe('Parcial 2 Modificado');
      expect(componentInState?.weight).toBe(35);
    });

    it('should ignore update if response is null', () => {
      service['_plan'].set(mockPlan);
      service.updateComponent(2, { name: 'Ignorado', weight: 35, description: '' }).subscribe();

      const req = httpMock.expectOne('/api/components/2');
      req.flush({ success: true, data: null });

      const componentInState = service.components().find(c => c.id === 2);
      expect(componentInState?.name).toBe('Parcial 2');
    });

    it('should handle update failure', () => {
      service.updateComponent(2, { name: 'Error', weight: 35, description: '' }).subscribe();
      const req = httpMock.expectOne('/api/components/2');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toBe('Error al actualizar el componente');
    });
  });

  describe('deleteComponent', () => {
    it('should remove component from plan', () => {
      service['_plan'].set(mockPlan);
      const componentCount = service.components().length;

      service.deleteComponent(1).subscribe(success => {
        expect(success).toBe(true);
      });

      const req = httpMock.expectOne('/api/components/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Componente eliminado', data: null });

      expect(service.components().length).toBe(componentCount - 1);
    });

    it('should handle deleteComponent failure', () => {
      service.deleteComponent(1).subscribe(success => {
        expect(success).toBe(false);
      });

      const req = httpMock.expectOne('/api/components/1');
      req.flush({ message: 'Cannot delete component' }, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toBe('Cannot delete component');
    });
  });

  describe('componentsTotalWeight / canActivate (Req 4 y 9)', () => {
    it('should compute componentsTotalWeight correctly and validate sum = 100 (valid case)', () => {
      service['_plan'].set(mockPlan);
      expect(service.componentsTotalWeight()).toBe(100);
      expect(service.isComponentsWeightValid()).toBe(true);
      expect(service.canActivate()).toBe(true);
      expect(service.componentsMissingWeight()).toBe(0);
      expect(service.componentsExcessWeight()).toBe(0);
    });

    it('should invalidate plan configuration when sum = 99 (boundary case)', () => {
      service['_plan'].set({
        ...mockPlan,
        components: [
          { id: 1, name: 'Parcial 1', weight: 30, description: '' },
          { id: 2, name: 'Parcial 2', weight: 30, description: '' },
          { id: 3, name: 'Prácticas', weight: 39, description: '' },
        ],
      });
      expect(service.componentsTotalWeight()).toBe(99);
      expect(service.isComponentsWeightValid()).toBe(false);
      expect(service.canActivate()).toBe(false);
      expect(service.componentsMissingWeight()).toBe(1);
      expect(service.componentsExcessWeight()).toBe(0);
    });

    it('should invalidate plan configuration when sum = 101 (boundary case)', () => {
      service['_plan'].set({
        ...mockPlan,
        components: [
          { id: 1, name: 'Parcial 1', weight: 30, description: '' },
          { id: 2, name: 'Parcial 2', weight: 30, description: '' },
          { id: 3, name: 'Prácticas', weight: 41, description: '' },
        ],
      });
      expect(service.componentsTotalWeight()).toBe(101);
      expect(service.isComponentsWeightValid()).toBe(false);
      expect(service.canActivate()).toBe(false);
      expect(service.componentsMissingWeight()).toBe(0);
      expect(service.componentsExcessWeight()).toBe(1);
    });

    it('should return 0 for empty plan', () => {
      service['_plan'].set({ ...mockPlan, components: [] });
      expect(service.componentsTotalWeight()).toBe(0);
      expect(service.canActivate()).toBe(false);
    });
  });

  describe('activatePlan', () => {
    it('should activate plan successfully', () => {
      service.activatePlan('10').subscribe(success => {
        expect(success).toBe(true);
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10/activate');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Plan activado', data: null });
    });

    it('should set error on activation failure', () => {
      service.activatePlan('10').subscribe(success => {
        expect(success).toBe(false);
      });

      const req = httpMock.expectOne('/api/evaluation-plans/subject/10/activate');
      req.flush({ success: false, message: 'La suma de pesos debe ser 100', data: null }, { status: 400, statusText: 'Bad Request' });

      expect(service.error()).toContain('100');
    });
  });

  describe('utilities', () => {
    it('should clear errors', () => {
      service.createPlan('10').subscribe();
      const req = httpMock.expectOne('/api/evaluation-plans/subject/10');
      req.flush({}, { status: 500, statusText: 'Server Error' });
      expect(service.error()).toBeTruthy();

      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('should ignore updateCurrentPlanComponents if plan is null', () => {
      service['_plan'].set(null);
      expect(() => {
        (service as any).updateCurrentPlanComponents((c: any) => c);
      }).not.toThrow();
    });
  });
});
