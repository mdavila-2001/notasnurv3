import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';

import {
  AttendanceStatus,
  AttendanceRowUi,
  AttendanceBulkRequest
} from '../../../core/models/attendance';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly api = inject(ApiService);
  private readonly operationalService = inject(SubjectOperationalService);

  private readonly _attendanceDraft = signal<AttendanceRowUi[]>([]);
  private readonly _date = signal<string>(this.todayISO());
  private readonly _isSaving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  // --- Selectores Públicos (Read-only) ---
  readonly attendanceDraft = computed(() => this._attendanceDraft());
  readonly date = computed(() => this._date());
  readonly isSaving = computed(() => this._isSaving());
  readonly error = computed(() => this._error());
  readonly successMessage = computed(() => this._successMessage());

  // Selector derivado para las estadísticas del Header de la UI
  readonly recordCounts = computed(() => {
    const records = this._attendanceDraft();
    return {
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      total: records.length,
    };
  });
  readonly isReadyToSubmit = computed(() =>
    !!this.operationalService.subject() && this._attendanceDraft().length > 0
  );

  initializeDraft(): void {
    this._error.set(null);
    this._successMessage.set(null);
    
    const students = this.operationalService.students();

    const initialDraft: AttendanceRowUi[] = students.map(student => ({
      enrollmentId: student.studentId,
      studentName: student.fullName,
      ci: student.ci ?? 'N/A',
      degreeName: student.degreeName,
      status: 'PRESENT'
    }));

    this._attendanceDraft.set(initialDraft);
  }

  setDate(date: string): void {
    this._date.set(date);
    this.clearFeedback();
  }

  /**
   * Actualiza el estado de un alumno específico en el borrador reactivo.
   */
  updateStudentStatus(enrollmentId: string, status: AttendanceStatus): void {
    this._attendanceDraft.update(currentDraft =>
      currentDraft.map(row => 
        row.enrollmentId === enrollmentId ? { ...row, status } : row
      )
    );
    this.clearFeedback();
  }

  /**
   * Acción en lote: Marca a todos los alumnos con un estado específico.
   */
  markAllAs(status: AttendanceStatus): void {
    this._attendanceDraft.update(currentDraft =>
      currentDraft.map(row => ({ ...row, status }))
    );
    this.clearFeedback();
  }

  // --- Comunicación con el Backend ---

  submit(): Observable<boolean> {
    const subjectId = this.operationalService.subject()?.id;
    
    if (!this.isReadyToSubmit() || !subjectId) {
      this._error.set('No hay datos para guardar o falta el contexto de la materia.');
      return of(false);
    }

    this._isSaving.set(true);
    this.clearFeedback();

    const request: AttendanceBulkRequest = {
      subjectId: Number(subjectId),
      date: this._date(),
      records: this._attendanceDraft().map(row => ({
        enrollmentId: row.enrollmentId,
        status: row.status,
      })),
    };

    return this.api.post<void>('/attendance/bulk', request).pipe(
      tap(() => {
        this._isSaving.set(false);
        this._successMessage.set('La asistencia se guardó correctamente.');
      }),
      map(() => true),
      catchError(err => {
        this._isSaving.set(false);
        this._error.set(err.error?.message ?? 'Ocurrió un error al guardar la asistencia.');
        return of(false);
      })
    );
  }

  clearFeedback(): void {
    this._error.set(null);
    this._successMessage.set(null);
  }

  resetModule(): void {
    this._attendanceDraft.set([]);
    this._date.set(this.todayISO());
    this._isSaving.set(false);
    this.clearFeedback();
  }

  // Helper interno
  private todayISO(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
}