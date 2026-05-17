import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';

export interface GradeRecord {
  enrollmentId: string;
  componentId: number;
  score: number | null;
  status: 'pending' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
}

export interface StudentGradeRow {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  ci: string;
  email: string;
  degreeName: string;
  score: number | null;
  status: 'pending' | 'saving' | 'saved' | 'error';
  errorMessage?: string;
}

interface GradeResponse {
  id: string;
  enrollmentId: string;
  componentId: number;
  score: number;
}

export interface GradeRequest {
  enrollmentId: string;
  componentId: number;
  score: number;
}

@Injectable()
export class GradeService {
  private readonly api = inject(ApiService);
  private readonly operationalService = inject(SubjectOperationalService);

  private readonly _selectedComponentId = signal<number | null>(null);
  private readonly _grades = signal<Map<string, Map<number, number>>>(new Map());
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _savingState = signal<Map<string, 'saving' | 'saved' | 'error'>>(new Map());

  readonly students = this.operationalService.students;
  readonly components = computed(() => this.operationalService.evaluationPlan()?.components ?? []);
  readonly selectedComponentId = computed(() => this._selectedComponentId());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  readonly selectedComponent = computed(() =>
    this.components().find(c => c.id === this._selectedComponentId()) ?? null
  );

  readonly studentRows = computed<StudentGradeRow[]>(() => {
    const componentId = this._selectedComponentId();
    if (!componentId) return [];

    return this.students().map(student => {
      const score = this._grades().get(student.studentId)?.get(componentId) ?? null;
      const key = `${student.studentId}-${componentId}`;
      const statusEntry = this._savingState().get(key);
      return {
        enrollmentId: student.studentId,
        studentId: student.studentId,
        fullName: student.fullName,
        ci: student.ci ?? '',
        email: student.email ?? '',
        degreeName: student.degreeName ?? '',
        score,
        status: statusEntry ?? (score !== null ? 'saved' : 'pending'),
        errorMessage: undefined,
      };
    });
  });

  readonly gradedCount = computed(() =>
    this.studentRows().filter(row => row.score !== null).length
  );

  readonly totalCount = computed(() => this.studentRows().length);

  readonly completionPercentage = computed(() =>
    this.totalCount() > 0 ? Math.round((this.gradedCount() / this.totalCount()) * 100) : 0
  );

  private readonly DTO_KEY_DELIMITER = '::';

  // Effect para auto-seleccionar el primer componente si no hay ninguno seleccionado
  constructor() {
    effect(() => {
      const comps = this.components();
      if (comps.length > 0 && this._selectedComponentId() === null) {
        this._selectedComponentId.set(comps[0].id);
      }
    }, { allowSignalWrites: true });
  }

  selectComponent(componentId: number): void {
    this._selectedComponentId.set(componentId);
  }

  updateGrade(studentId: string, score: number | null): void {
    const componentId = this._selectedComponentId();
    if (!componentId) return;

    this._grades.update(map => {
      const newMap = new Map(map);
      const studentGrades = new Map(newMap.get(studentId) ?? new Map());
      if (score === null) {
        studentGrades.delete(componentId);
      } else {
        studentGrades.set(componentId, Math.max(0, Math.min(100, score)));
      }
      if (studentGrades.size === 0) {
        newMap.delete(studentId);
      } else {
        newMap.set(studentId, studentGrades);
      }
      return newMap;
    });
  }

  saveGrade(studentId: string): Observable<boolean> {
    const componentId = this._selectedComponentId();
    const score = componentId ? this._grades().get(studentId)?.get(componentId) : undefined;

    if (!componentId || score === undefined || score === null) {
      return of(false);
    }

    const key = `${studentId}${this.DTO_KEY_DELIMITER}${componentId}`;
    this._savingState.update(map => {
      const newMap = new Map(map);
      newMap.set(key, 'saving');
      return newMap;
    });

    const request: GradeRequest = {
      enrollmentId: studentId,
      componentId,
      score,
    };

    return this.api.post<GradeResponse>('/grades', request).pipe(
      tap(() => {
        this._savingState.update(map => {
          const newMap = new Map(map);
          newMap.set(key, 'saved');
          return newMap;
        });
      }),
      map(() => true),
      catchError(error => {
        this._savingState.update(map => {
          const newMap = new Map(map);
          newMap.set(key, 'error');
          return newMap;
        });
        this._error.set(error.error?.message ?? 'Error al guardar la calificación');
        return of(false);
      }),
    );
  }

  getGrade(studentId: string): number | null {
    const componentId = this._selectedComponentId();
    if (!componentId) return null;
    return this._grades().get(studentId)?.get(componentId) ?? null;
  }

  clearError(): void {
    this._error.set(null);
  }

  reset(): void {
    this._selectedComponentId.set(null);
    this._grades.set(new Map());
    this._savingState.set(new Map());
    this._isLoading.set(false);
    this._error.set(null);
  }
}
