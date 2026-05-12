import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GradeService } from '../../../services/grade.service';

@Component({
  selector: 'app-grade-entry-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grade-tab">
      <div class="tab-header">
        <h2>Carga de Notas</h2>
        @if (service.totalCount() > 0) {
          <span class="progress-badge">
            {{ service.gradedCount() }}/{{ service.totalCount() }} calificados
            ({{ service.completionPercentage() }}%)
          </span>
        }
      </div>

      @if (service.error(); as errorMessage) {
        <div class="error-banner">{{ errorMessage }}</div>
      }

      @if (service.isLoading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined spinning">progress_activity</span>
          <p>Cargando estudiantes y componentes...</p>
        </div>
      } @else if (service.components().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">assignment</span>
          <p>Esta materia no tiene un plan de evaluación. Cree uno primero.</p>
        </div>
      } @else {
        <div class="component-selector">
          <label>Componente a calificar:</label>
          <select
            class="select-field"
            [ngModel]="service.selectedComponentId()"
            (ngModelChange)="handleComponentChange($event)"
          >
            @for (comp of service.components(); track comp.id) {
              <option [value]="comp.id">
                {{ comp.name }} ({{ comp.weight }}%) — {{ comp.description || 'Sin descripción' }}
              </option>
            }
          </select>
        </div>

        @if (service.selectedComponent(); as component) {
          <div class="component-info">
            <span class="info-badge">Peso del componente: {{ component.weight }}%</span>
            <span class="info-badge">Nota máxima: {{ component.weight }}</span>
          </div>
        }

        <div class="table-wrapper">
          <table class="grades-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th>CI</th>
                <th>Carrera</th>
                <th>Nota (0-{{ service.selectedComponent()?.weight ?? 100 }})</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of service.studentRows(); track row.studentId; let i = $index) {
                <tr>
                  <td class="row-number">{{ i + 1 }}</td>
                  <td class="student-name">{{ row.fullName }}</td>
                  <td>{{ row.ci }}</td>
                  <td>{{ row.degreeName || '—' }}</td>
                  <td>
                    <input
                      type="number"
                      class="grade-input"
                      [ngModel]="row.score"
                      (ngModelChange)="handleGradeChange(row.studentId, $event)"
                      [min]="0"
                      [max]="service.selectedComponent()?.weight ?? 100"
                      [disabled]="row.status === 'saving'"
                    />
                  </td>
                  <td>
                    @switch (row.status) {
                      @case ('saving') {
                        <span class="status-saving">Guardando...</span>
                      }
                      @case ('saved') {
                        <span class="status-saved">✓ Guardado</span>
                      }
                      @case ('error') {
                        <span class="status-error">✗ Error</span>
                      }
                      @default {
                        <span class="status-pending">—</span>
                      }
                    }
                  </td>
                  <td>
                    <button
                      class="btn-save"
                      [disabled]="row.score === null || row.score === undefined || row.status === 'saving'"
                      (click)="handleSave(row.studentId)"
                    >
                      @if (row.status === 'saving') {
                        Guardando...
                      } @else {
                        Guardar
                      }
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (service.studentRows().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined">group_off</span>
            <p>No hay estudiantes inscritos en esta materia</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .grade-tab { padding: 1rem 0; }
    .tab-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .tab-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--primary-color, #002131); }
    .progress-badge {
      font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem;
      border-radius: 9999px; background: #e0f2fe; color: #0369a1;
    }
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
    .component-selector { margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; }
    .component-selector label { font-size: 0.875rem; font-weight: 600; color: #374151; white-space: nowrap; }
    .select-field {
      padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
      font-size: 0.875rem; flex: 1; max-width: 400px; outline: none;
    }
    .select-field:focus { border-color: var(--primary-color, #002131); }
    .component-info { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .info-badge {
      font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem;
      border-radius: 9999px; background: #f3f4f6; color: #374151;
    }
    .table-wrapper { overflow-x: auto; border-radius: 0.75rem; border: 1px solid #e5e7eb; }
    .grades-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .grades-table th {
      text-align: left; padding: 0.75rem 1rem;
      background: #f9fafb; color: #374151;
      font-weight: 600; border-bottom: 1px solid #e5e7eb;
    }
    .grades-table td { padding: 0.5rem 1rem; border-bottom: 1px solid #f3f4f6; color: #4b5563; vertical-align: middle; }
    .grades-table tr:last-child td { border-bottom: none; }
    .grades-table tr:hover td { background: #f9fafb; }
    .row-number { color: #9ca3af; width: 2rem; }
    .student-name { font-weight: 500; color: #111827; }
    .grade-input {
      width: 80px; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db;
      border-radius: 0.375rem; font-size: 0.875rem; text-align: center; outline: none;
    }
    .grade-input:focus { border-color: var(--primary-color, #002131); }
    .status-saving { color: #d97706; font-size: 0.75rem; font-weight: 500; }
    .status-saved { color: #059669; font-size: 0.75rem; font-weight: 500; }
    .status-error { color: #dc2626; font-size: 0.75rem; font-weight: 500; }
    .status-pending { color: #9ca3af; font-size: 0.75rem; }
    .btn-save {
      padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem;
      font-weight: 600; cursor: pointer; border: 1px solid #d1d5db;
      background: white; color: #374151; transition: all 0.2s;
    }
    .btn-save:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class GradeEntryTabComponent implements OnInit {
  readonly subjectId = input.required<string>();
  readonly service = inject(GradeService);

  ngOnInit() {
    this.service.loadData(this.subjectId()).subscribe();
  }

  handleComponentChange(componentId: number) {
    this.service.selectComponent(componentId);
    this.service.clearError();
  }

  handleGradeChange(studentId: string, value: number | null) {
    this.service.updateGrade(studentId, value);
    this.service.clearError();
  }

  handleSave(studentId: string) {
    this.service.saveGrade(studentId).subscribe();
  }
}
