import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentApiService, StudentEnrolledResponse } from './enrollment-api.service';

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

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiService);
  private readonly enrollmentApi = inject(EnrollmentApiService);

  private readonly _students = signal<StudentEnrolledResponse[]>([]);
  private readonly _records = signal<Map<string, AttendanceStatus>>(new Map());
  private readonly _date = signal<string>(this.todayISO());
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);

  readonly date = computed(() => this._date());
  readonly isLoading = computed(() => this._isLoading());
  readonly isSaving = computed(() => this._isSaving());
  readonly error = computed(() => this._error());
  readonly successMessage = computed(() => this._successMessage());

  readonly attendanceRecords = computed<StudentAttendanceRecord[]>(() =>
    this._students().map(student => ({
      enrollmentId: student.studentId,
      fullName: student.fullName,
      ci: student.ci,
      email: student.email,
      degreeName: student.degreeName,
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

  readonly isReady = computed(() =>
    this._students().length > 0 && !!this._date() && this.attendanceRecords().length > 0
  );

  loadData(subjectId: string): Observable<void> {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    return this.enrollmentApi.getStudentsBySubject(subjectId).pipe(
      map(r => r.data ?? []),
      tap(students => {
        this._students.set(students);
        this._records.set(new Map());
        this._date.set(this.todayISO());
        this._isLoading.set(false);
      }),
      map(() => void 0),
      catchError(() => {
        this._error.set('Error al cargar los estudiantes');
        this._isLoading.set(false);
        return of(void 0);
      }),
    );
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

  submit(subjectId: string): Observable<boolean> {
    if (!this.isReady()) {
      this._error.set('No hay registros para enviar');
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
    this._students.set([]);
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
}
