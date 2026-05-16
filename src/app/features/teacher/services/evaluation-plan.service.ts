import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

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

export interface ComponentUpdateRequest {
  name: string;
  weight: number;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationPlanService {
  private readonly api = inject(ApiService);

  private readonly _plan = signal<EvaluationPlanResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _planCache = signal<Map<string, EvaluationPlanResponse | null>>(new Map());

  readonly plan = computed(() => this._plan());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());
  readonly hasPlan = computed(() => this._plan() !== null);
  readonly components = computed(() => this._plan()?.components ?? []);

  readonly componentsTotalWeight = computed(() =>
    this.components().reduce((total, component) => total + component.weight, 0),
  );

  readonly componentsMissingWeight = computed(() =>
    Math.max(100 - this.componentsTotalWeight(), 0),
  );

  readonly componentsExcessWeight = computed(() => Math.max(this.componentsTotalWeight() - 100, 0));

  readonly isComponentsWeightValid = computed(() => this.componentsTotalWeight() === 100);
  readonly canActivate = computed(() => this.isComponentsWeightValid());

  fetchPlan(subjectId: string): Observable<EvaluationPlanResponse | null> {
    const cachedPlan = this._planCache().get(subjectId);

    if (this._planCache().has(subjectId)) {
      this._plan.set(cachedPlan ?? null);
      return of(cachedPlan ?? null);
    }

    this._isLoading.set(true);
    this._error.set(null);

    return this.api.get<EvaluationPlanResponse>(`/evaluation-plans/subject/${subjectId}`).pipe(
      map((response) => response.data),
      tap((plan) => this.setPlanAndCache(subjectId, plan ?? null)),
      catchError(() => {
        this.setPlanAndCache(subjectId, null);
        return of(null);
      }),
      tap(() => this._isLoading.set(false)),
    );
  }

  createPlan(subjectId: string): Observable<EvaluationPlanResponse | null> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.post<EvaluationPlanResponse>(`/evaluation-plans/subject/${subjectId}`, {}).pipe(
      map((response) => response.data),
      tap((plan) => this.setPlanAndCache(subjectId, plan ?? null)),
      catchError((error) => {
        this._error.set(error.error?.message ?? 'Error al crear el plan de evaluación');
        return of(null);
      }),
      tap(() => this._isLoading.set(false)),
    );
  }

  addComponent(request: ComponentRequest): Observable<ComponentResponse | null> {
    this._error.set(null);

    return this.api.post<ComponentResponse>('/components', request).pipe(
      map((response) => response.data),
      tap((component) => {
        if (!component) {
          return;
        }

        this.updateCurrentPlanComponents((components) => [...components, component]);
      }),
      catchError((error) => {
        this._error.set(error.error?.message ?? 'Error al agregar el componente');
        return of(null);
      }),
    );
  }

  updateComponent(
    componentId: number,
    request: ComponentUpdateRequest,
  ): Observable<ComponentResponse | null> {
    this._error.set(null);

    return this.api.put<ComponentResponse>(`/components/${componentId}`, request).pipe(
      map((response) => response.data),
      tap((updatedComponent) => {
        if (!updatedComponent) {
          return;
        }

        this.updateCurrentPlanComponents((components) =>
          components.map((component) =>
            component.id === componentId ? updatedComponent : component,
          ),
        );
      }),
      catchError((error) => {
        this._error.set(error.error?.message ?? 'Error al actualizar el componente');
        return of(null);
      }),
    );
  }

  deleteComponent(componentId: number): Observable<boolean> {
    this._error.set(null);

    return this.api.delete<void>(`/components/${componentId}`).pipe(
      map(() => true),
      tap(() => {
        this.updateCurrentPlanComponents((components) =>
          components.filter((component) => component.id !== componentId),
        );
      }),
      catchError((error) => {
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
      catchError((error) => {
        this._error.set(error.error?.message ?? 'Error al finalizar la configuración del plan');
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

  private setPlanAndCache(subjectId: string, plan: EvaluationPlanResponse | null) {
    this._plan.set(plan);

    this._planCache.update((cache) => {
      const updatedCache = new Map(cache);
      updatedCache.set(subjectId, plan);
      return updatedCache;
    });
  }

  private updateCurrentPlanComponents(
    updater: (components: ComponentResponse[]) => ComponentResponse[],
  ) {
    const currentPlan = this._plan();

    if (!currentPlan) {
      return;
    }

    const updatedPlan: EvaluationPlanResponse = {
      ...currentPlan,
      components: updater(currentPlan.components),
    };

    this.setPlanAndCache(String(updatedPlan.subjectId), updatedPlan);
  }
}
