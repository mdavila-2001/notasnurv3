import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED';

export interface StudentAttendanceRecord {
  enrollmentId: string;
  fullName: string;
  ci: string;
  email: string;
  degreeName: string;
  status: AttendanceStatus;
}

export interface AttendanceBulkRequest {
  subjectId: number;
  date: string;
  records: { enrollmentId: string; status: AttendanceStatus }[];
}

@Injectable()
export class AttendanceService {
  private readonly api = inject(ApiService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly route = inject(ActivatedRoute);

  // Estados reactivos con Signals Únicas
  private readonly _records = signal<Map<string, AttendanceStatus>>(new Map());
  private readonly _date = signal<string>(this.todayISO());
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  // Selectores reactivos públicos
  readonly date = computed(() => this._date());
  readonly isLoading = computed(() => this._isLoading());
  readonly isSaving = computed(() => this._isSaving());
  readonly error = computed(() => this._error());
  readonly successMessage = computed(() => this._successMessage());

readonly attendanceRecords = computed<StudentAttendanceRecord[]>(() =>
    this.operationalService.students().map(student => ({
      // Volvemos a studentId para que compile, ya que StudentOperational solo tiene esa propiedad
      enrollmentId: student.studentId, 
      fullName: student.fullName,
      ci: student.ci ?? '',
      email: student.email ?? '',
      degreeName: student.degreeName ?? '',
      status: this._records().get(student.studentId) ?? 'PRESENT',
    }))
  );

  readonly recordCounts = computed(() => {
    const records = this.attendanceRecords();
    return {
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      justified: records.filter(r => r.status === 'JUSTIFIED').length,
      total: records.length,
    };
  });

  readonly isFutureDate = computed(() => this.isFuture(this._date()));

  // Estado de depuración unificado y corregido
  readonly debugReadyState = computed(() => {
    const hasStudents = this.operationalService.students().length > 0;
    const hasDate = !!this._date();
    const isNotFuture = !this.isFutureDate();
    const hasRecords = this.attendanceRecords().length > 0;
    
    // Intenta recuperar el ID de manera híbrida
    const subjectIdFromOperational = this.operationalService.subject()?.id;
    const subjectIdFromRoute = this.route.snapshot.paramMap.get('id');
    const hasSubject = !!(subjectIdFromOperational || subjectIdFromRoute);
    
    const isNotLoadingOperational = !this.operationalService.isLoading();
    
    return {
      hasStudents,
      hasDate,
      isNotFuture,
      hasRecords,
      hasSubject,
      isNotLoadingOperational,
      allReady: hasStudents && hasDate && isNotFuture && hasRecords && hasSubject && isNotLoadingOperational
    };
  });

  readonly isReady = computed(() => this.debugReadyState().allReady);

  loadData(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    this._records.set(new Map());
    this._date.set(this.todayISO());
    this._isLoading.set(false);
  }

  setDate(date: string): void {
    this._date.set(date);
    this._successMessage.set(null);
    this._error.set(null);
  }

  setAttendanceStatus(enrollmentId: string, status: AttendanceStatus): void {
    this._records.update(map => {
      const newMap = new Map(map);
      newMap.set(enrollmentId, status);
      return newMap;
    });
    this._error.set(null);
    this._successMessage.set(null);
  }

  submit(): Observable<boolean> {
    const subjectIdFromOperational = this.operationalService.subject()?.id;
    const subjectIdFromRoute = this.route.snapshot.paramMap.get('id');
    const subjectId = subjectIdFromOperational || subjectIdFromRoute;

    const hasStudents = this.operationalService.students().length > 0;
    const hasDate = !!this._date();
    const hasSubject = !!subjectId;
    const isLoadingOperational = this.operationalService.isLoading();

    if (isLoadingOperational) {
      this._error.set('Cargando datos de la materia. Por favor espere...');
      return of(false);
    }

    if (!hasSubject) {
      this._error.set('No se encontró el ID de la materia. Recargue la página.');
      return of(false);
    }

    if (!hasStudents) {
      this._error.set('No hay estudiantes inscritos en la materia.');
      return of(false);
    }

    if (!hasDate) {
      this._error.set('Seleccione una fecha para la asistencia.');
      return of(false);
    }

    if (this.isFutureDate()) {
      this._error.set('No puede registrar asistencia para una fecha futura.');
      return of(false);
    }

    if (!this.isReady()) {
      this._error.set('No hay registros para enviar o falta contexto de la materia');
      return of(false);
    }

    this._isSaving.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    const request: AttendanceBulkRequest = {
      subjectId: Number(subjectId),
      date: this._date(),
      records: this.attendanceRecords().map(r => ({
        enrollmentId: r.enrollmentId,
        status: r.status,
      })),
    };

    return this.api.post<void>('/attendance/bulk', request).pipe(
      tap(() => {
        this._isSaving.set(false);
        this._successMessage.set(`Asistencia registrada correctamente para el ${this._date()}`);
      }),
      map(() => true),
      catchError(error => {
        this._isSaving.set(false);
        this._error.set(error.error?.message ?? 'Error al registrar la asistencia');
        return of(false);
      }),
    );
  }

  reset(): void {
    this._records.set(new Map());
    this._date.set(this.todayISO());
    this._isLoading.set(false);
    this._isSaving.set(false);
    this._error.set(null);
    this._successMessage.set(null);
  }

  clearFeedback(): void {
    this._error.set(null);
    this._successMessage.set(null);
  }

  private todayISO(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  private isFuture(dateString: string): boolean {
    try {
      const selectedDate = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate > today;
    } catch {
      return false;
    }
  }
}