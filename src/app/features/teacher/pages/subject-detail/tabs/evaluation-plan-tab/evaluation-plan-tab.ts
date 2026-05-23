import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  ComponentRequest,
  ComponentResponse,
  ComponentUpdateRequest,
  EvaluationPlanService,
} from '../../../../services/evaluation-plan.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { Button } from '../../../../../../shared/components/button/button';
import { Input } from '../../../../../../shared/components/input/input';
import { Modal } from '../../../../../../shared/components/modal/modal';

@Component({
  selector: 'app-evaluation-plan-tab',
  standalone: true,
  imports: [CommonModule, Button, Input, Modal],
  templateUrl: './evaluation-plan-tab.html',
  styleUrl: './evaluation-plan-tab.css',
})
export class EvaluationPlanTab {
  private readonly service = inject(EvaluationPlanService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly toast = inject(ToastService);

  readonly hasPlan = computed(() => this.service.hasPlan());
  readonly isLoading = computed(() => this.service.isLoading());
  readonly errorMessage = computed(() => this.service.error());
  readonly components = computed(() => this.service.components());
  readonly componentsTotalWeight = computed(() => this.service.componentsTotalWeight());
  readonly componentsMissingWeight = computed(() => this.service.componentsMissingWeight());
  readonly componentsExcessWeight = computed(() => this.service.componentsExcessWeight());
  readonly isComponentsWeightValid = computed(() => this.service.isComponentsWeightValid());

  readonly newName = signal('');
  readonly newWeight = signal<number | null>(null);
  readonly newDescription = signal('');

  readonly editingComponentId = signal<number | null>(null);
  readonly editName = signal('');
  readonly editWeight = signal<number | null>(null);
  readonly editDescription = signal('');

  readonly componentToDelete = signal<ComponentResponse | null>(null);
  readonly deleteModalOpen = computed(() => this.componentToDelete() !== null);

  readonly currentSubjectId = computed(
    () => this.operationalService.subject()?.id?.toString() ?? null,
  );

  readonly selectedEditingComponent = computed(
    () => this.components().find((component) => component.id === this.editingComponentId()) ?? null,
  );

  readonly projectedNewTotalWeight = computed(
    () => this.componentsTotalWeight() + (this.newWeight() ?? 0),
  );

  readonly projectedEditTotalWeight = computed(() => {
    const editingComponent = this.selectedEditingComponent();

    if (!editingComponent) {
      return this.componentsTotalWeight();
    }

    return this.componentsTotalWeight() - editingComponent.weight + (this.editWeight() ?? 0);
  });

  readonly isAddComponentDisabled = computed(() => {
    const weight = this.newWeight();
    const currentTotal = this.componentsTotalWeight();

    return (
      currentTotal >= 100 ||
      !this.newName().trim() ||
      weight === null ||
      weight <= 0 ||
      weight > 100 ||
      this.projectedNewTotalWeight() > 100
    );
  });

  readonly isEditComponentDisabled = computed(() => {
    const weight = this.editWeight();

    return (
      !this.editName().trim() ||
      weight === null ||
      weight <= 0 ||
      weight > 100 ||
      this.projectedEditTotalWeight() > 100
    );
  });

  clearError() {
    this.service.clearError();
  }

  setNewName(value: string | number) {
    if (typeof value === 'string') {
      this.newName.set(value);
    }
  }

  setNewWeight(value: string | number | null) {
    if (value === null || value === '') {
      this.newWeight.set(null);
      return;
    }

    const parsed = typeof value === 'number' ? value : parseFloat(value);
    this.newWeight.set(Number.isNaN(parsed) ? null : parsed);
  }

  setNewDescription(value: string | number) {
    if (typeof value === 'string') {
      this.newDescription.set(value);
    }
  }

  setEditName(value: string | number) {
    if (typeof value === 'string') {
      this.editName.set(value);
    }
  }

  setEditWeight(value: string | number | null) {
    if (value === null || value === '') {
      this.editWeight.set(null);
      return;
    }

    const parsed = typeof value === 'number' ? value : parseFloat(value);
    this.editWeight.set(Number.isNaN(parsed) ? null : parsed);
  }

  setEditDescription(value: string | number) {
    if (typeof value === 'string') {
      this.editDescription.set(value);
    }
  }

  handleCreate() {
    const subjectId = this.currentSubjectId();

    if (!subjectId) {
      return;
    }

    this.service.createPlan(subjectId).subscribe((plan) => {
      if (plan) {
        this.toast.success('Plan de evaluación creado correctamente.', 'Plan creado');
      }
    });
  }

  handleAddComponent() {
    const plan = this.service.plan();

    if (!plan || this.isAddComponentDisabled()) {
      return;
    }

    const request: ComponentRequest = {
      name: this.newName().trim(),
      weight: this.newWeight()!,
      description: this.newDescription().trim(),
      planId: plan.id,
    };

    this.service.addComponent(request).subscribe((component) => {
      if (!component) {
        return;
      }

      this.newName.set('');
      this.newWeight.set(null);
      this.newDescription.set('');

      this.toast.success('Componente agregado correctamente.', 'Componente creado');
    });
  }

  startEdit(component: ComponentResponse) {
    this.editingComponentId.set(component.id);
    this.editName.set(component.name);
    this.editWeight.set(component.weight);
    this.editDescription.set(component.description ?? '');
  }

  cancelEdit() {
    this.editingComponentId.set(null);
    this.editName.set('');
    this.editWeight.set(null);
    this.editDescription.set('');
  }

  handleSaveEdit() {
    const componentId = this.editingComponentId();

    if (!componentId || this.isEditComponentDisabled()) {
      return;
    }

    const request: ComponentUpdateRequest = {
      name: this.editName().trim(),
      weight: this.editWeight()!,
      description: this.editDescription().trim(),
    };

    this.service.updateComponent(componentId, request).subscribe((component) => {
      if (!component) {
        return;
      }

      this.cancelEdit();
      this.toast.success('Componente actualizado correctamente.', 'Componente actualizado');
    });
  }

  requestDelete(component: ComponentResponse) {
    this.componentToDelete.set(component);
  }

  cancelDelete() {
    this.componentToDelete.set(null);
  }

  confirmDelete() {
    const component = this.componentToDelete();

    if (!component) {
      return;
    }

    this.service.deleteComponent(component.id).subscribe((deleted) => {
      if (!deleted) {
        return;
      }

      if (this.editingComponentId() === component.id) {
        this.cancelEdit();
      }

      this.toast.success('Componente eliminado correctamente.', 'Componente eliminado');
      this.cancelDelete();
    });
  }

  handleFinalizeConfiguration() {
    const subjectId = this.currentSubjectId();

    if (!subjectId) {
      return;
    }

    if (!this.isComponentsWeightValid()) {
      this.toast.warning(
        'No puedes finalizar hasta que la suma de los componentes sea exactamente 100%.',
        'Configuración incompleta',
      );
      return;
    }

    this.service.activatePlan(subjectId).subscribe((success) => {
      if (success) {
        this.toast.success('Configuración finalizada correctamente.', 'Plan finalizado');
      }
    });
  }
}
