import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationPlanService, ComponentRequest } from '../../../services/evaluation-plan.service';

@Component({
  selector: 'app-evaluation-plan-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plan-tab">
      <div class="tab-header">
        <h2>Plan de Evaluación</h2>
        @if (service.hasPlan()) {
          <span class="weight-badge" [class.valid]="service.canActivate()" [class.invalid]="!service.canActivate()">
            Peso total: {{ service.weightSum() }}%
          </span>
        }
      </div>

      @if (service.error(); as errorMessage) {
        <div class="error-banner">{{ errorMessage }}</div>
      }

      @if (service.isLoading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined spinning">progress_activity</span>
          <p>Cargando...</p>
        </div>
      } @else if (!service.hasPlan()) {
        <div class="empty-state">
          <span class="material-symbols-outlined">assignment_add</span>
          <p>Esta materia aún no tiene un plan de evaluación</p>
          <button class="btn-primary" (click)="handleCreate()">Crear Plan de Evaluación</button>
        </div>
      } @else {
        <div class="components-list">
          <div class="list-header">
            <span class="col-name">Componente</span>
            <span class="col-weight">Peso</span>
            <span class="col-desc">Descripción</span>
            <span class="col-action"></span>
          </div>

          @for (component of service.components(); track component.id) {
            <div class="component-row">
              <span class="col-name">{{ component.name }}</span>
              <span class="col-weight">{{ component.weight }}%</span>
              <span class="col-desc">{{ component.description || '—' }}</span>
              <span class="col-action">
                <button class="btn-icon" (click)="handleDelete(component.id)" title="Eliminar">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </span>
            </div>
          } @empty {
            <div class="empty-components">
              <p>Sin componentes. Agregue al menos un componente.</p>
            </div>
          }
        </div>

        <div class="add-component-section">
          <h3>Agregar Componente</h3>
          <div class="add-form">
            <input
              [(ngModel)]="newName"
              placeholder="Nombre del componente"
              class="input-field"
            />
            <input
              type="number"
              [(ngModel)]="newWeight"
              placeholder="Peso (%)"
              class="input-field weight-input"
              min="1"
              max="100"
            />
            <input
              [(ngModel)]="newDescription"
              placeholder="Descripción (opcional)"
              class="input-field"
            />
            <button
              class="btn-secondary"
              [disabled]="!newName || !newWeight"
              (click)="handleAddComponent()"
            >
              Agregar
            </button>
          </div>
        </div>

        <div class="actions-section">
          <button
            class="btn-primary"
            [disabled]="!service.canActivate()"
            (click)="handleActivate()"
          >
            {{ service.canActivate() ? 'Activar Plan' : 'Los componentes deben sumar 100%' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .plan-tab { padding: 1rem 0; max-width: 48rem; }
    .tab-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .tab-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--primary-color, #002131); }
    .weight-badge {
      font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;
    }
    .weight-badge.valid { background: #dcfce7; color: #166534; }
    .weight-badge.invalid { background: #fef2f2; color: #991b1b; }
    .error-banner {
      padding: 0.75rem 1rem; border-radius: 0.5rem; background: #fef2f2;
      color: #991b1b; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 4rem 0; color: #9ca3af; gap: 0.75rem;
    }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .components-list {
      border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; margin-bottom: 1.5rem;
    }
    .list-header, .component-row {
      display: grid; grid-template-columns: 2fr 1fr 2fr auto;
      gap: 0.75rem; padding: 0.75rem 1rem; align-items: center; font-size: 0.875rem;
    }
    .list-header { background: #f9fafb; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
    .component-row { border-bottom: 1px solid #f3f4f6; }
    .component-row:last-child { border-bottom: none; }
    .component-row:hover { background: #f9fafb; }
    .empty-components { padding: 2rem 1rem; text-align: center; color: #9ca3af; }
    .add-component-section { margin-bottom: 1.5rem; }
    .add-component-section h3 { font-size: 0.875rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #374151; }
    .add-form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .input-field {
      padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
      font-size: 0.875rem; outline: none; transition: border-color 0.2s; flex: 1; min-width: 120px;
    }
    .input-field:focus { border-color: var(--primary-color, #002131); }
    .weight-input { max-width: 100px; }
    .actions-section { padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    .btn-primary, .btn-secondary, .btn-icon {
      padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-primary { background: var(--primary-color, #002131); color: white; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-icon {
      padding: 0.25rem; background: transparent; color: #9ca3af; display: flex; align-items: center;
    }
    .btn-icon:hover { color: #ef4444; background: #fef2f2; }
  `]
})
export class EvaluationPlanTabComponent implements OnInit {
  readonly subjectId = input.required<string>();
  readonly service = inject(EvaluationPlanService);

  newName = '';
  newWeight = 0;
  newDescription = '';

  ngOnInit() {
    this.service.fetchPlan(this.subjectId()).subscribe();
  }

  handleCreate() {
    this.service.createPlan(this.subjectId()).subscribe();
  }

  handleAddComponent() {
    const plan = this.service.plan();
    if (!plan || !this.newName || !this.newWeight) return;

    const request: ComponentRequest = {
      name: this.newName,
      weight: this.newWeight,
      description: this.newDescription,
      planId: plan.id,
    };

    this.service.addComponent(request).subscribe(() => {
      this.newName = '';
      this.newWeight = 0;
      this.newDescription = '';
    });
  }

  handleDelete(componentId: number) {
    this.service.deleteComponent(componentId).subscribe();
  }

  handleActivate() {
    this.service.activatePlan(this.subjectId()).subscribe();
  }
}
