import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaluationPlanTab } from './evaluation-plan-tab';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { EvaluationPlanService, ComponentResponse } from '../../../../services/evaluation-plan.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

describe('EvaluationPlanTab', () => {
  let component: EvaluationPlanTab;
  let fixture: ComponentFixture<EvaluationPlanTab>;
  let mockEvaluationPlanService: any;
  let mockOperationalService: any;
  let mockToastService: any;

  const mockComponent: ComponentResponse = {
    id: 1,
    name: 'Examen 1',
    weight: 30,
    description: 'Primer parcial'
  };

  beforeEach(async () => {
    mockEvaluationPlanService = {
      plan: signal({ id: 100, subjectId: 10, components: [] }),
      hasPlan: signal(true),
      components: signal([mockComponent]),
      componentsTotalWeight: signal(30),
      componentsMissingWeight: signal(70),
      componentsExcessWeight: signal(0),
      isLoading: signal(false),
      error: signal(null),
      clearError: vi.fn(),
      isComponentsWeightValid: signal(false),
      createPlan: vi.fn(() => of({ id: 100, subjectId: 10, components: [] })),
      addComponent: vi.fn(() => of(mockComponent)),
      updateComponent: vi.fn(() => of(mockComponent)),
      deleteComponent: vi.fn(() => of(true)),
      activatePlan: vi.fn(() => of(true)),
    };

    mockOperationalService = {
      subject: signal({ id: 10, name: 'Math' }),
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Setters', () => {
    it('should set new component values', () => {
      component.setNewName('Examen');
      component.setNewWeight(25);
      component.setNewDescription('Test desc');

      expect(component.newName()).toBe('Examen');
      expect(component.newWeight()).toBe(25);
      expect(component.newDescription()).toBe('Test desc');

      component.setNewWeight('');
      expect(component.newWeight()).toBeNull();

      component.setNewWeight('abc'); // invalid parsed float
      expect(component.newWeight()).toBeNull();

      component.setNewWeight('15.5');
      expect(component.newWeight()).toBe(15.5);
    });

    it('should set edit component values', () => {
      component.setEditName('Quiz');
      component.setEditWeight(10);
      component.setEditDescription('Pop quiz');

      expect(component.editName()).toBe('Quiz');
      expect(component.editWeight()).toBe(10);
      expect(component.editDescription()).toBe('Pop quiz');

      component.setEditWeight('');
      expect(component.editWeight()).toBeNull();

      component.setEditWeight('invalid');
      expect(component.editWeight()).toBeNull();

      component.setEditWeight('12');
      expect(component.editWeight()).toBe(12);
    });
  });

  describe('handleCreate', () => {
    it('should trigger plan creation', () => {
      component.handleCreate();
      expect(mockEvaluationPlanService.createPlan).toHaveBeenCalledWith('10');
      expect(mockToastService.success).toHaveBeenCalled();
    });
  });

  describe('handleAddComponent', () => {
    it('should add component and clear form fields on success', () => {
      component.setNewName('Examen 2');
      component.setNewWeight(40);
      component.setNewDescription('Segundo parcial');

      component.handleAddComponent();

      expect(mockEvaluationPlanService.addComponent).toHaveBeenCalled();
      expect(component.newName()).toBe('');
      expect(component.newWeight()).toBeNull();
      expect(component.newDescription()).toBe('');
      expect(mockToastService.success).toHaveBeenCalled();
    });
  });

  describe('Editing component', () => {
    it('should start, cancel and save edit', () => {
      component.startEdit(mockComponent);
      expect(component.editingComponentId()).toBe(mockComponent.id);
      expect(component.editName()).toBe(mockComponent.name);
      expect(component.editWeight()).toBe(mockComponent.weight);

      component.cancelEdit();
      expect(component.editingComponentId()).toBeNull();
      expect(component.editName()).toBe('');

      // Save edit
      component.startEdit(mockComponent);
      component.setEditName('Updated Examen');
      component.setEditWeight(35);
      component.handleSaveEdit();

      expect(mockEvaluationPlanService.updateComponent).toHaveBeenCalledWith(
        mockComponent.id,
        { name: 'Updated Examen', weight: 35, description: mockComponent.description }
      );
      expect(mockToastService.success).toHaveBeenCalled();
      expect(component.editingComponentId()).toBeNull();
    });
  });

  describe('Deleting component', () => {
    it('should request, cancel and confirm delete', () => {
      component.requestDelete(mockComponent);
      expect(component.componentToDelete()).toEqual(mockComponent);
      expect(component.deleteModalOpen()).toBe(true);

      component.cancelDelete();
      expect(component.componentToDelete()).toBeNull();

      // Confirm delete
      component.requestDelete(mockComponent);
      component.confirmDelete();
      expect(mockEvaluationPlanService.deleteComponent).toHaveBeenCalledWith(mockComponent.id);
      expect(mockToastService.success).toHaveBeenCalled();
    });
  });

  describe('Validation conditions and projected weights', () => {
    it('should compute isAddComponentDisabled correctly', () => {
      // Empty name
      component.setNewName('');
      component.setNewWeight(20);
      expect(component.isAddComponentDisabled()).toBe(true);

      // Weight exceeds limit
      component.setNewName('Valid Name');
      component.setNewWeight(105);
      expect(component.isAddComponentDisabled()).toBe(true);

      // Weight zero or negative
      component.setNewWeight(0);
      expect(component.isAddComponentDisabled()).toBe(true);

      // Projected total exceeds 100
      mockEvaluationPlanService.componentsTotalWeight.set(90);
      component.setNewWeight(15);
      expect(component.isAddComponentDisabled()).toBe(true);

      // Valid case
      component.setNewWeight(5);
      expect(component.isAddComponentDisabled()).toBe(false);
    });

    it('should compute isEditComponentDisabled correctly', () => {
      component.startEdit(mockComponent);

      component.setEditName('');
      expect(component.isEditComponentDisabled()).toBe(true);

      component.setEditName('Valid Name');
      component.setEditWeight(110);
      expect(component.isEditComponentDisabled()).toBe(true);

      component.setEditWeight(0);
      expect(component.isEditComponentDisabled()).toBe(true);

      component.setEditWeight(10);
      expect(component.isEditComponentDisabled()).toBe(false);
    });
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
