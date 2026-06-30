import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';
import { StudentOperational } from '../../../core/models/operational.model';
import {
  AttendanceStatus,
  AttendanceRowUi,
  AttendanceBulkRequest,
  AttendanceAbsenceRecord,
} from '../../../core/models/attendance';

@Injectable()
export class AttendanceService {
  private readonly api = inject(ApiService);
  private readonly operationalService = inject(SubjectOperationalService);

  private readonly _attendanceDraft = signal<AttendanceRowUi[]>([]);
  private readonly _absencesCache = signal<Map<string, Map<string, number>>>(new Map());
  private readonly _date = signal<string>(this.todayISO());
  private readonly _isSaving = signal(false);
  private readonly _isDraftHydrating = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  // --- Selectores Públicos (Read-only) ---
  readonly attendanceDraft = computed(() => this._attendanceDraft());
  readonly date = computed(() => this._date());
  readonly isSaving = computed(() => this._isSaving());
  readonly isDraftHydrating = computed(() => this._isDraftHydrating());
  readonly error = computed(() => this._error());
  readonly successMessage = computed(() => this._successMessage());

  getSubjectAbsences(subjectId: string): Observable<Map<string, number>> {
    const cachedAbsences = this._absencesCache().get(subjectId);

    if (cachedAbsences) {
      return of(cachedAbsences);
    }

    return this.api.get<AttendanceAbsenceRecord[]>(`/attendance/subject/${subjectId}/absences`).pipe(
      map((response) => this.normalizeAbsenceRecords(response.data ?? [])),
      tap((absencesMap) => {
        this._absencesCache.update((currentCache) => {
          const nextCache = new Map(currentCache);
          nextCache.set(subjectId, absencesMap);
          return nextCache;
        });
      }),
    );
  }

  // Selector derivado para las estadísticas del Header de la UI
  readonly recordCounts = computed(() => {
    const records = this._attendanceDraft();
    return {
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'JUSTIFIED').length,
      total: records.length,
    };
  });

  readonly isReadyToSubmit = computed(() =>
    this._attendanceDraft().length > 0 &&
    !this._isSaving() &&
    !this._isDraftHydrating() &&
    this.operationalService.currentSubjectId() !== null &&
    this._date() !== '' &&
    this._date() !== null &&
    this._date() !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(this._date())
  );

  initializeDraft(students: StudentOperational[] = this.operationalService.students(), subjectId: string | null = this.operationalService.subject()?.id?.toString() ?? null): void {
    this._error.set(null);
    this._successMessage.set(null);

    if (!students.length) {
      this._attendanceDraft.set([]);
      this._isDraftHydrating.set(false);
      return;
    }

    this._isDraftHydrating.set(true);

    const initialDraft: AttendanceRowUi[] = students.map(student => ({
      id: this.resolveEnrollmentId(student),
      enrollmentId: this.resolveEnrollmentId(student),
      studentName: student.fullName,
      ci: student.ci ?? 'N/A',
      degreeName: student.degreeName,
      photoUrl: student.photoUrl,
      absencesCount: 0,
      totalAbsences: 0,
      status: 'PRESENT',
    }));

    this._attendanceDraft.set(initialDraft);

    if (!subjectId) {
      this._isDraftHydrating.set(false);
      return;
    }

    this.getSubjectAbsences(subjectId).subscribe({
      next: (absencesMap) => {
        this._attendanceDraft.update(currentDraft =>
          currentDraft.map((row) => ({
            ...row,
            totalAbsences: absencesMap.get(row.enrollmentId) ?? row.totalAbsences,
            absencesCount: absencesMap.get(row.enrollmentId) ?? row.absencesCount,
          })),
        );
        this.loadAttendanceForDate(subjectId, this._date(), students, true);
      },
      error: () => {
        this.loadAttendanceForDate(subjectId, this._date(), students, true);
      },
    });
  }

  setDate(date: string): void {
    this._date.set(date);
    this.clearFeedback();
    
    // Al cambiar la fecha, intentar cargar las asistencias registradas para ese día
    const subjectId = this.operationalService.currentSubjectId();
    const students = this.operationalService.students();
    
    if (subjectId && students.length > 0) {
      this.loadAttendanceForDate(subjectId, date, students);
    }
  }

  private loadAttendanceForDate(subjectId: string, date: string, _students: StudentOperational[], fromInit = false): void {
    if (!fromInit) {
      this._isDraftHydrating.set(true);
    }
    
    this.api.get<any>(`/attendance/subject/${subjectId}`, { date }).pipe(
      catchError((err) => {
        return of(null);
      })
    ).subscribe((response) => {
      // El backend devuelve ApiResponse<List<AttendanceRecordResponse>>
      // Cada AttendanceRecordResponse tiene: enrollmentId (UUID), studentId (UUID), fullName, status, date
      const records: any[] = Array.isArray(response?.data) ? response.data : [];
      
      this._attendanceDraft.update(currentDraft => {
        return currentDraft.map(row => {
          // Comparar por enrollmentId o studentId del backend
          const existingRecord = records.find(r => {
            const backendEnrollmentId = String(r.enrollmentId ?? '').trim();
            const backendStudentId = String(r.studentId ?? '').trim();
            const draftEnrollmentId = String(row.enrollmentId ?? '').trim();
            return backendEnrollmentId === draftEnrollmentId || backendStudentId === draftEnrollmentId;
          });
          
          return {
            ...row,
            status: existingRecord ? existingRecord.status : (fromInit ? row.status : 'PRESENT')
          };
        });
      });
      this._isDraftHydrating.set(false);
    });
  }

  updateStudentStatus(enrollmentId: string, status: AttendanceStatus): void {
    const normalizedEnrollmentId = enrollmentId.trim();

    this._attendanceDraft.update(currentDraft =>
      currentDraft.map(row =>
        row.enrollmentId === normalizedEnrollmentId ? { ...row, status } : row
      )
    );
    this.clearFeedback();
  }

  markAllAs(status: AttendanceStatus): void {
    this._attendanceDraft.update(currentDraft =>
      currentDraft.map(row => ({ ...row, status }))
    );
    this.clearFeedback();
  }

  submit(subjectId: string): Observable<boolean> {
    if (!subjectId || Number.isNaN(Number(subjectId))) {
      return throwError(() => new Error('No se pudo determinar la materia. Intentá recargar la página.'));
    }

    const draft = this._attendanceDraft();
    if (draft.length === 0 || this._isSaving() || this._isDraftHydrating()) {
      return throwError(() => new Error('No hay datos para guardar. Esperá a que cargue la lista de estudiantes.'));
    }

    this._isSaving.set(true);
    this.clearFeedback();

    const request: AttendanceBulkRequest = {
      subjectId: Number(subjectId),
      date: this._date(),
      records: draft.map(row => ({
        enrollmentId: row.enrollmentId,
        status: row.status,
      })),
    };
    
    return this.api.post<void>('/attendance/bulk', request).pipe(
      tap(() => {
        this._successMessage.set('Asistencia registrada con éxito');
      }),
      map(() => true),
      catchError(err => {
        const message = err?.error?.message ?? err?.message ?? 'Ocurrió un error al guardar la asistencia.';
        this._error.set(message);
        return throwError(() => new Error(message));
      }),
      finalize(() => {
        this._isSaving.set(false);
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
    this._isDraftHydrating.set(false);
    this.clearFeedback();
  }

  private normalizeAbsenceRecords(records: any): Map<string, number> {
    const absencesMap = new Map<string, number>();
    
    // El backend devuelve AttendanceAbsencesResponse: { students: [...], absenceLimit: N }
    // Cada StudentAbsence tiene: enrollmentId, studentId, fullName, absencesCount
    const actualRecords: any[] = Array.isArray(records)
      ? records
      : (records?.students ?? records?.records ?? []);

    for (const record of actualRecords) {
      const enrollmentKey = record.enrollmentId === null || record.enrollmentId === undefined
        ? ''
        : String(record.enrollmentId).trim();

      if (!enrollmentKey) {
        continue;
      }

      // El campo en StudentAbsence es 'absencesCount'
      const absences = record.absencesCount ?? record.absences ?? record.totalAbsences ?? 0;
      absencesMap.set(enrollmentKey, Math.max(0, absences));
    }

    return absencesMap;
  }

  private resolveEnrollmentId(student: StudentOperational): string {
    return student.enrollmentId?.trim() || student.studentId || '';
  }

  private todayISO(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
}