import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { concat, firstValueFrom, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GradeBulkRequest, GradeRequest, GradeResponse, GradeRowUI } from '../../../../core/models/grade.models';
import { EvaluationComponent, StudentOperational } from '../../../../core/models/operational.model';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';
import { Loader } from '../../../../shared/components/loader/loader';
import { Modal } from '../../../../shared/components/modal/modal';
import { Table, TableColumn } from '../../../../shared/components/table/table';
import { ToastService } from '../../../../shared/services/toast.service';
import { GradeApiService } from '../../services/grade-api.service';

type GradeLoadState = {
  subjectId: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  grades: GradeResponse[];
  message: string;
};

type GradeGridRow = GradeRowUI & {
  finalGrade: number;
};

@Component({
  selector: 'app-grade-grid',
  standalone: true,
  imports: [CommonModule, Button, Input, Loader, Modal, Table],
  templateUrl: './grade-grid.component.html',
  styleUrl: './grade-grid.component.css',
  providers: [GradeApiService],
})
export class GradeGridComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly gradeApi = inject(GradeApiService);
  private readonly toast = inject(ToastService);

  readonly routeSubjectId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('subjectId'))),
    { initialValue: null as string | null },
  );

  readonly students = computed(() => this.operationalService.students());
  readonly components = computed(() => this.operationalService.evaluationPlan()?.components ?? []);
  readonly currentSubjectId = computed(() => this.operationalService.currentSubjectId());
  readonly studentsLoading = computed(() => this.operationalService.studentsLoading());
  readonly subjectLoading = computed(() => this.operationalService.isLoading());

  private readonly gradeRowsDraft = signal<GradeRowUI[]>([]);
  private readonly initializedSubjectId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly isSaveModalOpen = signal(false);

  readonly summaryColumns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Componente' },
    { key: 'weight', label: 'Peso (%)' },
    { key: 'description', label: 'Descripción' },
  ]);

  readonly summaryRows = computed(() =>
    this.components().map((component) => ({
      id: component.id,
      name: component.name,
      weight: `${component.weight}%`,
      description: component.description || '—',
    })),
  );

  readonly gridColumns = computed<TableColumn[]>(() => [
    { key: 'student', label: 'Estudiante' },
    ...this.components().map((component) => ({
      key: `component-${component.id}`,
      label: component.name,
    })),
    { key: 'finalGrade', label: 'Promedio ponderado' },
  ]);

  readonly existingGradesState = toSignal(
    toObservable(this.routeSubjectId).pipe(
      distinctUntilChanged(),
      switchMap((subjectId) => {
        if (!subjectId) {
          return of<GradeLoadState>({
            subjectId: null,
            status: 'idle',
            grades: [],
            message: '',
          });
        }

        const loadingState: GradeLoadState = {
          subjectId,
          status: 'loading',
          grades: [],
          message: '',
        };

        const grades$ = this.gradeApi.getGradesBySubject(subjectId).pipe(
          map((grades) => ({
            subjectId,
            status: 'success' as const,
            grades,
            message: '',
          })),
          catchError((error) => {
            const message = this.extractErrorMessage(
              error,
              'No se pudieron cargar las notas existentes. Se mostrarán las filas vacías.',
            );

            this.toast.warning(message, 'Notas existentes no disponibles');

            return of<GradeLoadState>({
              subjectId,
              status: 'error',
              grades: [],
              message,
            });
          }),
        );

        return concat(of<GradeLoadState>(loadingState), grades$);
      }),
    ),
    {
      initialValue: {
        subjectId: null,
        status: 'idle',
        grades: [],
        message: '',
      },
    },
  );

  readonly existingGrades = computed(() => this.existingGradesState().grades);
  readonly existingGradesMap = computed(() => {
    const map = new Map<string, number>();

    for (const grade of this.existingGrades()) {
      map.set(this.buildCellKey(grade.enrollmentId, grade.componentId), grade.score);
    }

    return map;
  });

  readonly gradeRows = computed<GradeGridRow[]>(() => {
    const components = this.components();

    return this.gradeRowsDraft().map((row) => ({
      ...row,
      finalGrade: this.calculateFinalGrade(row.scores, components),
    }));
  });

  readonly hasComponents = computed(() => this.components().length > 0);
  readonly hasStudents = computed(() => this.students().length > 0);
  readonly isGradesLoading = computed(() => this.existingGradesState().status === 'loading');
  readonly isLoading = computed(() => this.subjectLoading() || this.studentsLoading() || this.isGradesLoading());
  readonly loadErrorMessage = computed(() => {
    if (this.existingGradesState().status === 'error') {
      return this.existingGradesState().message;
    }

    return this.operationalService.studentsError() ?? this.operationalService.error() ?? '';
  });
  readonly hasValidEnrollmentIds = computed(() => this.gradeRowsDraft().every((row) => Number.isFinite(row.enrollmentId)));
  readonly saveableGradeCount = computed(() => this.buildSavePayload().grades.length);
  readonly canSave = computed(() =>
    this.hasComponents() &&
    this.hasStudents() &&
    this.saveableGradeCount() > 0 &&
    this.hasValidEnrollmentIds() &&
    !this.isLoading() &&
    !this.isSaving(),
  );

  constructor() {
    effect(
      () => {
        const subjectId = this.routeSubjectId();

        this.isSaveModalOpen.set(false);
        this.gradeRowsDraft.set([]);
        this.initializedSubjectId.set(null);

        if (!subjectId) {
          return;
        }

        this.operationalService.loadSubjectContext(subjectId);
        void this.operationalService.loadStudents(subjectId);
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const subjectId = this.routeSubjectId();
        const students = this.students();
        const components = this.components();
        const gradeLoadState = this.existingGradesState();

        if (!subjectId || this.studentsLoading() || gradeLoadState.status === 'loading') {
          return;
        }

        if (this.initializedSubjectId() === subjectId) {
          return;
        }

        this.gradeRowsDraft.set(this.buildDraftRows(students, components, this.existingGradesMap()));
        this.initializedSubjectId.set(subjectId);
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const message = this.operationalService.studentsError();

        if (message) {
          this.toast.warning(message, 'Carga de estudiantes');
        }
      },
      { allowSignalWrites: false },
    );
  }

  openSaveModal(): void {
    if (!this.canSave()) {
      return;
    }

    this.isSaveModalOpen.set(true);
  }

  closeSaveModal(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaveModalOpen.set(false);
  }

  async confirmSave(): Promise<void> {
    if (!this.canSave() || this.isSaving()) {
      return;
    }

    const payload = this.buildSavePayload();

    if (payload.grades.length === 0) {
      this.toast.warning('Ingresa al menos una nota válida antes de guardar.', 'Sin notas');
      return;
    }

    this.isSaving.set(true);

    try {
      await firstValueFrom(this.gradeApi.saveGrades(payload));
      this.toast.success('Las notas se guardaron correctamente.', 'Guardado masivo');
      this.isSaveModalOpen.set(false);
    } catch (error) {
      this.toast.error(this.extractErrorMessage(error, 'No se pudieron guardar las notas.'), 'Guardado fallido');
    } finally {
      this.isSaving.set(false);
    }
  }

  onGradeChange(enrollmentId: number, componentId: number, value: string | number): void {
    const normalizedScore = this.normalizeScoreValue(value);

    this.gradeRowsDraft.update((currentRows) =>
      currentRows.map((row) =>
        row.enrollmentId === enrollmentId
          ? {
              ...row,
              scores: {
                ...row.scores,
                [componentId]: normalizedScore,
              },
            }
          : row,
      ),
    );
  }

  getCellValue(enrollmentId: number, componentId: number): string | number {
    const row = this.gradeRowsDraft().find((currentRow) => currentRow.enrollmentId === enrollmentId);
    const rawValue = row?.scores[componentId] ?? null;

    return rawValue ?? '';
  }

  isCellInvalid(enrollmentId: number, componentId: number): boolean {
    const row = this.gradeRowsDraft().find((currentRow) => currentRow.enrollmentId === enrollmentId);

    if (!row) {
      return false;
    }

    const value = row.scores[componentId];

    return value !== null && (!Number.isFinite(value) || value < 0 || value > 100);
  }

  private buildDraftRows(
    students: StudentOperational[],
    components: EvaluationComponent[],
    existingGradesMap: Map<string, number>,
  ): GradeRowUI[] {
    return students.map((student) => {
      const enrollmentId = this.parseEnrollmentId(student.studentId);
      const scores: Record<number, number | null> = {};

      for (const component of components) {
        const cellKey = this.buildCellKey(enrollmentId, component.id);
        scores[component.id] = existingGradesMap.get(cellKey) ?? null;
      }

      return {
        studentId: student.studentId,
        enrollmentId,
        studentName: student.fullName,
        ci: student.ci,
        degreeName: student.degreeName,
        scores,
      };
    });
  }

  private buildSavePayload(): GradeBulkRequest {
    const grades: GradeRequest[] = [];

    for (const row of this.gradeRowsDraft()) {
      if (!Number.isFinite(row.enrollmentId)) {
        continue;
      }

      for (const [componentIdText, score] of Object.entries(row.scores)) {
        if (score === null) {
          continue;
        }

        const componentId = Number(componentIdText);

        if (!Number.isFinite(componentId)) {
          continue;
        }

        grades.push({
          enrollmentId: row.enrollmentId,
          componentId,
          score,
        });
      }
    }

    return { grades };
  }

  private calculateFinalGrade(scores: Record<number, number | null>, components: EvaluationComponent[]): number {
    return components.reduce((total, component) => {
      const score = scores[component.id];

      if (score === null || score === undefined) {
        return total;
      }

      return total + (score * component.weight) / 100;
    }, 0);
  }

  private parseEnrollmentId(studentId: string): number {
    const parsed = Number(studentId);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private normalizeScoreValue(value: string | number): number | null {
    if (value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.max(0, Math.min(100, parsed));
  }

  private buildCellKey(enrollmentId: number, componentId: number): string {
    return `${enrollmentId}_${componentId}`;
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const backendError = (error as { error?: { message?: string } }).error;

      if (backendError?.message?.trim()) {
        return backendError.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}