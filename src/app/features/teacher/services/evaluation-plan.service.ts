import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api.models';

export interface ComponentResponse {
  id: number;
  name: string;
  weight: number;
  description: string;
}

export interface EvaluationPlanResponse {
  id: number;
  subjectId: number;
  components: ComponentResponse[];
}

export interface ComponentRequest {
  name: string;
  weight: number;
  description: string;
  planId: number;
}

@Injectable()
export class EvaluationPlanService {
  private readonly api = inject(ApiService);

  private readonly _plan = signal<EvaluationPlanResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly plan = computed(() => this._plan());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  readonly weightSum = computed(() =>
    this._plan()?.components.reduce((acc, c) => acc + c.weight, 0) ?? 0
  );

  readonly canActivate = computed(() => this.weightSum() === 100);
  readonly hasPlan = computed(() => this._plan() !== null);
  readonly components = computed(() => this._plan()?.components ?? []);

  fetchPlan(subjectId: string): Observable<EvaluationPlanResponse | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.get<EvaluationPlanResponse>(`/evaluation-plans/subject/${subjectId}`).pipe(
      map(response => response.data),
      tap(plan => this._plan.set(plan)),
      catchError(() => {
        this._plan.set(null);
        return of(null);
      }),
      tap(() => this._isLoading.set(false)),
    );
  }

  createPlan(subjectId: string): Observable<EvaluationPlanResponse | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.post<EvaluationPlanResponse>(`/evaluation-plans/subject/${subjectId}`, {}).pipe(
      map(response => response.data),
      tap(plan => this._plan.set(plan)),
      catchError(error => {
        this._error.set(error.error?.message ?? 'Error al crear el plan de evaluación');
        return of(null);
      }),
      tap(() => this._isLoading.set(false)),
    );
  }

  addComponent(request: ComponentRequest): Observable<ComponentResponse | null> {
    this._error.set(null);

    return this.api.post<ComponentResponse>('/components', request).pipe(
      map(response => response.data),
      tap(component => {
        const current = this._plan();
        if (current) {
          this._plan.set({ ...current, components: [...current.components, component] });
        }
      }),
      catchError(error => {
        this._error.set(error.error?.message ?? 'Error al agregar el componente');
        return of(null);
      }),
    );
  }

  deleteComponent(componentId: number): Observable<boolean> {
    this._error.set(null);

    return this.api.delete<void>(`/components/${componentId}`).pipe(
      map(() => true),
      tap(() => {
        const current = this._plan();
        if (current) {
          this._plan.set({
            ...current,
            components: current.components.filter(c => c.id !== componentId),
          });
        }
      }),
      catchError(error => {
        this._error.set(error.error?.message ?? 'Error al eliminar el componente');
        return of(false);
      }),
    );
  }

  activatePlan(subjectId: string): Observable<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.post<void>(`/evaluation-plans/subject/${subjectId}/activate`, {}).pipe(
      map(() => true),
      catchError(error => {
        this._error.set(error.error?.message ?? 'Error al activar el plan');
        return of(false);
      }),
      tap(() => this._isLoading.set(false)),
    );
  }

  clearError() {
    this._error.set(null);
  }

  reset() {
    this._plan.set(null);
    this._isLoading.set(false);
    this._error.set(null);
  }
}
