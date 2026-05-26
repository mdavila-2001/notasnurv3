import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationPlanTab } from './evaluation-plan-tab';

import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EvaluationPlanService } from '../../../../services/evaluation-plan.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

describe('EvaluationPlanTab', () => {
  let component: EvaluationPlanTab;
  let fixture: ComponentFixture<EvaluationPlanTab>;
  let mockEvaluationPlanService: any;
  let mockOperationalService: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockEvaluationPlanService = {
      plan: signal(null),
      hasPlan: signal(true),
      components: signal([]),
      componentsTotalWeight: signal(0),
      componentsMissingWeight: signal(0),
      componentsExcessWeight: signal(0),
      isLoading: signal(false),
      error: signal(null),
      clearError: vi.fn(),
      isComponentsWeightValid: signal(false),
      createPlan: vi.fn(() => of(null)),
      addComponent: vi.fn(() => of(null)),
      updateComponent: vi.fn(() => of(null)),
      deleteComponent: vi.fn(() => of(true)),
      activatePlan: vi.fn(() => of(true)),
    };

    mockOperationalService = {
      subject: signal(null),
      isLoading: signal(false),
    };

    mockToastService = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EvaluationPlanTab],
      providers: [
        { provide: EvaluationPlanService, useValue: mockEvaluationPlanService },
        { provide: SubjectOperationalService, useValue: mockOperationalService },
        { provide: ToastService, useValue: mockToastService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationPlanTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleFinalizeConfiguration', () => {
    it('should show success toast on successful activation', () => {
      mockEvaluationPlanService.isComponentsWeightValid.set(true);
      mockEvaluationPlanService.activatePlan.mockReturnValue(of(true));
      mockOperationalService.subject.set({ id: 10 } as any);

      component.handleFinalizeConfiguration();

      expect(mockEvaluationPlanService.activatePlan).toHaveBeenCalledWith('10');
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Configuración finalizada correctamente.',
        'Plan finalizado'
      );
    });

    it('should show error toast on activation failure', () => {
      mockEvaluationPlanService.isComponentsWeightValid.set(true);
      mockEvaluationPlanService.activatePlan.mockReturnValue(of(false));
      mockEvaluationPlanService.error.set('Suma de pesos inválida');
      mockOperationalService.subject.set({ id: 10 } as any);

      component.handleFinalizeConfiguration();

      expect(mockEvaluationPlanService.activatePlan).toHaveBeenCalledWith('10');
      expect(mockToastService.error).toHaveBeenCalledWith(
        'Suma de pesos inválida',
        'Error al finalizar'
      );
    });

    it('should not activate plan if components weight is invalid', () => {
      mockEvaluationPlanService.isComponentsWeightValid.set(false);
      mockOperationalService.subject.set({ id: 10 } as any);

      component.handleFinalizeConfiguration();

      expect(mockEvaluationPlanService.activatePlan).not.toHaveBeenCalled();
      expect(mockToastService.warning).toHaveBeenCalled();
    });
  });
});
