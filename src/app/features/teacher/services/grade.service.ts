import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentApiService, StudentEnrolledResponse } from './enrollment-api.service';
import { EvaluationPlanService, ComponentResponse } from './evaluation-plan.service';

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

@Injectable({ providedIn: 'root' })
export class GradeService {
  private readonly api = inject(ApiService);
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly evaluationPlanService = inject(EvaluationPlanService);

  private readonly _students = signal<StudentEnrolledResponse[]>([]);
  private readonly _components = signal<ComponentResponse[]>([]);
  private readonly _selectedComponentId = signal<number | null>(null);
  private readonly _grades = signal<Map<string, Map<number, number>>>(new Map());
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _savingState = signal<Map<string, 'saving' | 'saved' | 'error'>>(new Map());

  readonly students = computed(() => this._students());
  readonly components = computed(() => this._components());
  readonly selectedComponentId = computed(() => this._selectedComponentId());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  readonly selectedComponent = computed(() =>
    this._components().find(c => c.id === this._selectedComponentId()) ?? null
  );

  readonly studentRows = computed<StudentGradeRow[]>(() => {
    const componentId = this._selectedComponentId();
    if (!componentId) return [];

    return this._students().map(student => {
      const score = this._grades().get(student.studentId)?.get(componentId) ?? null;
      const key = `${student.studentId}-${componentId}`;
      const statusEntry = this._savingState().get(key);
      return {
        enrollmentId: student.studentId,
        studentId: student.studentId,
        fullName: student.fullName,
        ci: student.ci,
        email: student.email,
        degreeName: student.degreeName,
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

  loadData(subjectId: string): Observable<void> {
    this._isLoading.set(true);
    this._error.set(null);

    return forkJoin({
      students: this.enrollmentApi.getStudentsBySubject(subjectId).pipe(
        map(r => r.data ?? []),
        catchError(() => of([] as StudentEnrolledResponse[])),
      ),
      components: this.evaluationPlanService.fetchPlan(subjectId).pipe(
        map(plan => plan?.components ?? []),
        catchError(() => of([] as ComponentResponse[])),
      ),
    }).pipe(
      tap(({ students, components }) => {
        this._students.set(students);
        this._components.set(components);
        this._grades.set(new Map());
        this._savingState.set(new Map());
        this._selectedComponentId.set(components.length > 0 ? components[0].id : null);
        this._isLoading.set(false);
      }),
      map(() => void 0),
      catchError(error => {
        this._error.set('Error al cargar datos para calificación');
        this._isLoading.set(false);
        return of(void 0);
      }),
    );
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
    this._students.set([]);
    this._components.set([]);
    this._selectedComponentId.set(null);
    this._grades.set(new Map());
    this._savingState.set(new Map());
    this._isLoading.set(false);
    this._error.set(null);
  }
}
