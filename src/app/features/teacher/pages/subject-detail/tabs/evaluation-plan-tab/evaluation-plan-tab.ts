import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ComponentRequest,
  ComponentResponse,
  ComponentUpdateRequest,
  EvaluationPlanService,
} from '../../../../services/evaluation-plan.service';
import { Button } from '../../../../../../shared/components/button/button';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-evaluation-plan-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './evaluation-plan-tab.html',
  styleUrl: './evaluation-plan-tab.css',
})
export class EvaluationPlanTab {
  readonly service = inject(EvaluationPlanService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly toast = inject(ToastService);

  readonly newName = signal('');
  readonly newWeight = signal<number | null>(null);
  readonly newDescription = signal('');

  readonly editingComponentId = signal<number | null>(null);
  readonly editName = signal('');
  readonly editWeight = signal<number | null>(null);
  readonly editDescription = signal('');

  /** Convierte el valor del input a number en la frontera (sin Number() disperso) */
  setNewWeight(value: string | number | null) {
    if (value === null || value === '') {
      this.newWeight.set(null);
      return;
    }
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    this.newWeight.set(isNaN(parsed) ? null : parsed);
  }

  setEditWeight(value: string | number | null) {
    if (value === null || value === '') {
      this.editWeight.set(null);
      return;
    }
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    this.editWeight.set(isNaN(parsed) ? null : parsed);
  }

  readonly currentSubjectId = computed(
    () => this.operationalService.subject()?.id?.toString() ?? null,
  );

  readonly selectedEditingComponent = computed(
    () =>
      this.service.components().find((component) => component.id === this.editingComponentId()) ??
      null,
  );

  readonly projectedNewTotalWeight = computed(
    () => this.service.componentsTotalWeight() + (this.newWeight() ?? 0),
  );

  readonly projectedEditTotalWeight = computed(() => {
    const editingComponent = this.selectedEditingComponent();

    if (!editingComponent) {
      return this.service.componentsTotalWeight();
    }

    return (
      this.service.componentsTotalWeight() - editingComponent.weight + (this.editWeight() ?? 0)
    );
  });

  readonly isAddComponentDisabled = computed(() => {
    const weight = this.newWeight();
    const currentTotal = this.service.componentsTotalWeight();

    return (
      currentTotal >= 100 || // Ya se alcanzó el 100%, bloquear completamente
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

  handleDelete(component: ComponentResponse) {
    const confirmed = confirm(`¿Eliminar el componente "${component.name}"?`);

    if (!confirmed) {
      return;
    }

    this.service.deleteComponent(component.id).subscribe((deleted) => {
      if (deleted) {
        this.toast.success('Componente eliminado correctamente.', 'Componente eliminado');
      }
    });
  }

  handleFinalizeConfiguration() {
    const subjectId = this.currentSubjectId();

    if (!subjectId) {
      return;
    }

    if (!this.service.isComponentsWeightValid()) {
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
