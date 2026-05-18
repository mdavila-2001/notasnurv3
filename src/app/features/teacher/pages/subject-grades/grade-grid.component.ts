import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { concat, firstValueFrom, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { GradeApiService } from '../../services/grade-api.service';
import { GradeBulkRequest, GradeRequest, GradeResponse } from '../../../../core/models/grade.models';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';
import { Loader } from '../../../../shared/components/loader/loader';
import { Modal } from '../../../../shared/components/modal/modal';
import { Table, TableColumn } from '../../../../shared/components/table/table';
import { ToastService } from '../../../../shared/services/toast.service';

interface GradeGridCellViewModel {
  componentId: number;
  rawValue: number | string | null;
  parsedScore: number | null;
  invalid: boolean;
}

interface GradeGridRowViewModel {
  studentId: string;
  enrollmentId: number;
  studentName: string;
  cells: GradeGridCellViewModel[];
  finalGrade: number;
}

interface GradeLoadState {
  subjectId: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  grades: GradeResponse[];
  message: string;
}

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

  private readonly overrideCellValues = signal<Map<string, number | string | null>>(new Map());
  readonly isSaving = signal(false);
  readonly isSaveModalOpen = signal(false);

  readonly componentColumns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Componente' },
    { key: 'weight', label: 'Peso (%)' },
    { key: 'description', label: 'Descripción' },
  ]);

  readonly componentRows = computed(() =>
    this.components().map((component) => ({
      name: component.name,
      weight: `${component.weight}%`,
      description: component.description || '—',
    })),
  );

  readonly gridColumns = computed(() => {
    const componentColumns = this.components().length;
    return `minmax(220px, 1.8fr) repeat(${componentColumns}, minmax(110px, 1fr)) minmax(140px, 0.9fr)`;
  });

  readonly componentWeightMap = computed(
    () => new Map(this.components().map((component) => [component.id, component.weight] as const)),
  );

  readonly gradeFetchState = toSignal(
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
              'No se pudieron cargar las notas existentes. Solo se mostrarán las nuevas.',
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

  readonly existingGrades = computed(() => this.gradeFetchState().grades);
  readonly existingGradesMap = computed(() => {
    const map = new Map<string, number>();

    for (const grade of this.existingGrades()) {
      map.set(this.buildCellKey(grade.enrollmentId, grade.componentId), grade.score);
    }

    return map;
  });

  readonly cellValues = computed(() => {
    const mergedValues = new Map<string, number | string | null>(this.existingGradesMap());

    for (const [key, value] of this.overrideCellValues()) {
      mergedValues.set(key, value);
    }

    return mergedValues;
  });

  readonly gradeRows = computed<GradeGridRowViewModel[]>(() => {
    const components = this.components();
    const values = this.cellValues();

    return this.students().map((student) => {
      const enrollmentId = this.parseEnrollmentId(student.studentId);
      const cells = components.map((component) => {
        const key = this.buildCellKey(enrollmentId, component.id);
        const rawValue = values.get(key) ?? null;
        const parsedScore = this.parseScore(rawValue);

        return {
          componentId: component.id,
          rawValue,
          parsedScore,
          invalid: this.isInvalidRawValue(rawValue),
        };
      });

      return {
        studentId: student.studentId,
        enrollmentId,
        studentName: student.fullName,
        cells,
        finalGrade: this.calculateFinalGrade(cells),
      };
    });
  });

  readonly isGradesLoading = computed(() => this.gradeFetchState().status === 'loading');
  readonly isContextLoading = computed(() => this.operationalService.isLoading());
  readonly isLoading = computed(() => this.isContextLoading() || this.studentsLoading() || this.isGradesLoading());
  readonly loadErrorMessage = computed(() => {
    if (this.gradeFetchState().status === 'error') {
      return this.gradeFetchState().message;
    }

    return this.operationalService.studentsError() ?? this.operationalService.error() ?? '';
  });
  readonly hasValidEnrollmentIds = computed(() => this.gradeRows().every((row) => Number.isFinite(row.enrollmentId)));
  readonly isAllValid = computed(() => this.gradeRows().every((row) => row.cells.every((cell) => !cell.invalid)));
  readonly saveableGradeCount = computed(() => this.buildSavePayload().grades.length);
  readonly hasComponents = computed(() => this.components().length > 0);

  constructor() {
    effect(
      () => {
        const subjectId = this.routeSubjectId();

        if (!subjectId) {
          return;
        }

        this.isSaveModalOpen.set(false);
        this.overrideCellValues.set(new Map());
        this.operationalService.loadSubjectContext(subjectId);
        void this.operationalService.loadStudents(subjectId);
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

  openSaveModal() {
    if (!this.isAllValid() || !this.hasValidEnrollmentIds() || this.isSaving() || this.isLoading()) {
      return;
    }

    this.isSaveModalOpen.set(true);
  }

  closeSaveModal() {
    if (this.isSaving()) {
      return;
    }

    this.isSaveModalOpen.set(false);
  }

  async confirmSave() {
    if (!this.isAllValid() || !this.hasValidEnrollmentIds() || this.isSaving()) {
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
      this.toast.success('Notas guardadas correctamente', 'Notas guardadas');
      this.isSaveModalOpen.set(false);
    } catch (error) {
      this.toast.warning(this.extractErrorMessage(error, 'No se pudieron guardar las notas.'), 'Guardado fallido');
    } finally {
      this.isSaving.set(false);
    }
  }

  onGradeChange(enrollmentId: number, componentId: number, value: string | number) {
    const key = this.buildCellKey(enrollmentId, componentId);

    this.overrideCellValues.update((currentValues) => {
      const nextValues = new Map(currentValues);
      nextValues.set(key, value === '' ? null : value);
      return nextValues;
    });
  }

  getCellValue(enrollmentId: number, componentId: number): string | number {
    const rawValue = this.cellValues().get(this.buildCellKey(enrollmentId, componentId)) ?? null;

    if (rawValue === null) {
      return '';
    }

    if (typeof rawValue === 'number' && Number.isNaN(rawValue)) {
      return '';
    }

    return rawValue;
  }

  isInvalidCell(enrollmentId: number, componentId: number): boolean {
    const rawValue = this.cellValues().get(this.buildCellKey(enrollmentId, componentId)) ?? null;
    return this.isInvalidRawValue(rawValue);
  }

  private buildSavePayload(): GradeBulkRequest {
    const grades: GradeRequest[] = [];

    for (const row of this.gradeRows()) {
      if (!Number.isFinite(row.enrollmentId)) {
        continue;
      }

      for (const cell of row.cells) {
        if (cell.parsedScore === null) {
          continue;
        }

        grades.push({
          enrollmentId: row.enrollmentId,
          componentId: cell.componentId,
          score: cell.parsedScore,
        });
      }
    }

    return { grades };
  }

  private calculateFinalGrade(cells: GradeGridCellViewModel[]): number {
    const weightMap = this.componentWeightMap();

    return cells.reduce((total, cell) => {
      if (cell.parsedScore === null) {
        return total;
      }

      const weight = weightMap.get(cell.componentId) ?? 0;
      return total + (cell.parsedScore * weight) / 100;
    }, 0);
  }

  private parseEnrollmentId(studentId: string): number {
    const parsed = Number(studentId);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private parseScore(value: number | string | null): number | null {
    if (value === null || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return null;
    }

    return parsed;
  }

  private isInvalidRawValue(value: number | string | null): boolean {
    if (value === null || value === '') {
      return false;
    }

    if (typeof value === 'number') {
      return Number.isNaN(value) || value < 0 || value > 100;
    }

    const parsed = Number(value);
    return !Number.isFinite(parsed) || parsed < 0 || parsed > 100;
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
