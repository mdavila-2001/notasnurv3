import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceStatus } from '../../../services/attendance.service';

@Component({
  selector: 'app-attendance-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="attendance-tab">
      <div class="tab-header">
        <h2>Registro de Asistencia</h2>
        @if (service.recordCounts(); as counts) {
          <div class="counts-row">
            <span class="count present">{{ counts.present }} Presentes</span>
            <span class="count absent">{{ counts.absent }} Ausentes</span>
            <span class="count justified">{{ counts.justified }} Justificados</span>
            <span class="count total">{{ counts.total }} Total</span>
          </div>
        }
      </div>

      @if (service.successMessage(); as msg) {
        <div class="success-banner">{{ msg }}</div>
      }

      @if (service.error(); as errorMessage) {
        <div class="error-banner">{{ errorMessage }}</div>
      }

      <div class="date-picker-row">
        <label for="att-date">Fecha:</label>
        <input
          id="att-date"
          type="date"
          class="date-input"
          [ngModel]="service.date()"
          (ngModelChange)="handleDateChange($event)"
        />
      </div>

      @if (service.isLoading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined spinning">progress_activity</span>
          <p>Cargando estudiantes...</p>
        </div>
      } @else {
        <div class="bulk-actions">
          <button class="btn-bulk" (click)="setAll('PRESENT')">Todos Presentes</button>
          <button class="btn-bulk absent" (click)="setAll('ABSENT')">Todos Ausentes</button>
        </div>

        <div class="table-wrapper">
          <table class="attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th>CI</th>
                <th>Carrera</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (row of service.attendanceRecords(); track row.enrollmentId; let i = $index) {
                <tr>
                  <td class="row-number">{{ i + 1 }}</td>
                  <td class="student-name">{{ row.fullName }}</td>
                  <td>{{ row.ci }}</td>
                  <td>{{ row.degreeName || '—' }}</td>
                  <td>
                    <div class="status-selector">
                      <button
                        class="status-btn"
                        [class.active]="row.status === 'PRESENT'"
                        (click)="handleStatusChange(row.enrollmentId, 'PRESENT')"
                      >P</button>
                      <button
                        class="status-btn absent"
                        [class.active]="row.status === 'ABSENT'"
                        (click)="handleStatusChange(row.enrollmentId, 'ABSENT')"
                      >A</button>
                      <button
                        class="status-btn justified"
                        [class.active]="row.status === 'JUSTIFIED'"
                        (click)="handleStatusChange(row.enrollmentId, 'JUSTIFIED')"
                      >J</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-cell">
                    <div class="empty-state">
                      <span class="material-symbols-outlined">group_off</span>
                      <p>No hay estudiantes inscritos</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="submit-section">
          <button
            class="btn-primary"
            [disabled]="service.isSaving() || !service.isReady()"
            (click)="handleSubmit()"
          >
            @if (service.isSaving()) {
              Guardando...
            } @else {
              Guardar Asistencia
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .attendance-tab { padding: 1rem 0; }
    .tab-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .tab-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--primary-color, #002131); }
    .counts-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .count {
      font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }
    .count.present { background: #dcfce7; color: #166534; }
    .count.absent { background: #fef2f2; color: #991b1b; }
    .count.justified { background: #fef9c3; color: #854d0e; }
    .count.total { background: #f3f4f6; color: #374151; }
    .success-banner {
      padding: 0.75rem 1rem; border-radius: 0.5rem; background: #dcfce7;
      color: #166534; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .error-banner {
      padding: 0.75rem 1rem; border-radius: 0.5rem; background: #fef2f2;
      color: #991b1b; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .date-picker-row {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;
    }
    .date-picker-row label { font-size: 0.875rem; font-weight: 600; color: #374151; }
    .date-input {
      padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
      font-size: 0.875rem; outline: none;
    }
    .date-input:focus { border-color: var(--primary-color, #002131); }
    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 4rem 0; color: #9ca3af; gap: 0.75rem;
    }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .bulk-actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .btn-bulk {
      padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem;
      font-weight: 600; cursor: pointer; border: 1px solid #d1d5db;
      background: white; color: #374151; transition: all 0.2s;
    }
    .btn-bulk:hover { background: #f3f4f6; }
    .btn-bulk.absent:hover { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
    .table-wrapper { overflow-x: auto; border-radius: 0.75rem; border: 1px solid #e5e7eb; margin-bottom: 1rem; }
    .attendance-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .attendance-table th {
      text-align: left; padding: 0.75rem 1rem;
      background: #f9fafb; color: #374151;
      font-weight: 600; border-bottom: 1px solid #e5e7eb;
    }
    .attendance-table td { padding: 0.5rem 1rem; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
    .attendance-table tr:last-child td { border-bottom: none; }
    .attendance-table tr:hover td { background: #f9fafb; }
    .row-number { color: #9ca3af; width: 2rem; }
    .student-name { font-weight: 500; color: #111827; }
    .empty-cell { padding: 2rem !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; color: #9ca3af; gap: 0.5rem; }
    .status-selector { display: flex; gap: 0.25rem; }
    .status-btn {
      width: 2rem; height: 2rem; border-radius: 0.375rem;
      border: 1px solid #d1d5db; background: white;
      font-size: 0.75rem; font-weight: 700; cursor: pointer;
      transition: all 0.15s; display: flex; align-items: center; justify-content: center;
    }
    .status-btn:hover { background: #f3f4f6; }
    .status-btn.active { background: var(--primary-color, #002131); color: white; border-color: var(--primary-color, #002131); }
    .status-btn.absent.active { background: #dc2626; border-color: #dc2626; }
    .status-btn.justified.active { background: #d97706; border-color: #d97706; }
    .submit-section { padding-top: 1rem; }
    .btn-primary {
      padding: 0.5rem 1.5rem; border-radius: 0.5rem; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; border: none;
      background: var(--primary-color, #002131); color: white; transition: all 0.2s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AttendanceTabComponent implements OnInit {
  readonly subjectId = input.required<string>();
  readonly service = inject(AttendanceService);

  ngOnInit() {
    this.service.loadData(this.subjectId()).subscribe();
  }

  handleDateChange(date: string) {
    this.service.setDate(date);
  }

  handleStatusChange(enrollmentId: string, status: AttendanceStatus) {
    this.service.setAttendanceStatus(enrollmentId, status);
  }

  setAll(status: AttendanceStatus) {
    for (const record of this.service.attendanceRecords()) {
      this.service.setAttendanceStatus(record.enrollmentId, status);
    }
  }

  handleSubmit() {
    this.service.submit(this.subjectId()).subscribe();
  }
}
