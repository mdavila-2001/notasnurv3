import { CommonModule, Location } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, concat, firstValueFrom, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GradeAcademicStatus, GradeBulkRequest, GradeRequest, GradeResponse, GradeRowUI } from '../../../../core/models/grade.models';
import { EvaluationComponent, StudentOperational } from '../../../../core/models/operational.model';
import { SubjectModality } from '../../../../core/models/subject.model';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { AttendanceService } from '../../../../features/teacher/services/attendance.service';
import { Button } from '../../../../shared/components/button/button';
import { Badge } from '../../../../shared/components/badge/badge';
import { Input } from '../../../../shared/components/input/input';
import { Loader } from '../../../../shared/components/loader/loader';
import { Modal } from '../../../../shared/components/modal/modal';
import { Table, TableColumn } from '../../../../shared/components/table/table';
import { ToastService } from '../../../../shared/services/toast.service';
import { GradeApiService } from '../../services/grade-api.service';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { CURRENT_DATE } from '../../../../core/services/settings/current-date.token';
import { GlobalSettingsResponse } from '../../../../core/models/settings.model';

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
  imports: [CommonModule, Button, Badge, Input, Loader, Modal, Table],
  templateUrl: './grade-grid.component.html',
  styleUrl: './grade-grid.component.css',
  providers: [AttendanceService, GradeApiService],
})
export class GradeGridComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly gradeApi = inject(GradeApiService);
  private readonly toast = inject(ToastService);
  private readonly settingsService = inject(GlobalSettingsService);
  private readonly getCurrentDate = inject(CURRENT_DATE);

  readonly globalSettings = signal<GlobalSettingsResponse | null>(null);
  readonly currentDate = signal<Date>(this.getCurrentDate());

  readonly routeSubjectId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('subjectId') ?? params.get('id'))),
    { initialValue: null as string | null },
  );

  readonly students = computed(() => this.operationalService.students());
  readonly components = computed(() => this.operationalService.evaluationPlan()?.components ?? []);
  readonly currentSubjectId = computed(() => this.operationalService.currentSubjectId());
  readonly studentsLoading = computed(() => this.operationalService.studentsLoading());
  readonly subjectLoading = computed(() => this.operationalService.isLoading());

  private readonly gradeRowsDraft = signal<GradeRowUI[]>([]);
  private readonly initializedSubjectId = signal<string | null>(null);
  private readonly invalidEnrollmentToastSignature = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly isSaveModalOpen = signal(false);

  readonly summaryColumns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Componente' },
    { key: 'weight', label: 'Puntaje máximo' },
    { key: 'description', label: 'Descripción' },
  ]);

  readonly summaryRows = computed(() =>
    this.components().map((component) => ({
      id: component.id,
      name: component.name,
      weight: `${component.weight} pts`,
      description: component.description || '—',
    })),
  );

  readonly tableColumns = computed<TableColumn[]>(() => [
    { key: 'student', label: 'Estudiante' },
    ...this.components().map((component) => ({
      key: `component-${component.id}`,
      label: component.name,
    })),
    { key: 'finalGrade', label: 'Nota final' },
    { key: 'academicStatus', label: 'Estado académico' },
  ]);

  readonly absencesMap = signal<Map<string, number>>(new Map());
  readonly absencesLoading = signal(false);

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
      map.set(this.buildCellKey(String(grade.enrollmentId), grade.componentId), grade.score);
    }

    return map;
  });

  readonly tableData = computed<GradeGridRow[]>(() => {
    const components = this.components();
    const attendanceMap = this.absencesMap();
    const absenceLimit = this.getAbsenceLimit(this.operationalService.subject()?.modality ?? null);

    return this.gradeRowsDraft().map((row) => {
      const finalGrade = this.calculateFinalGrade(row.scores, components);

      return {
        ...row,
        finalGrade,
        academicStatus: this.resolveAcademicStatus(row, components, finalGrade, attendanceMap, absenceLimit),
      };
    });
  });

  readonly academicStatus = computed(() => {
    const statuses = new Map<string, GradeAcademicStatus>();

    for (const row of this.tableData()) {
      statuses.set(this.getRowKey(row), row.academicStatus);
    }

    return statuses;
  });

  readonly hasComponents = computed(() => this.components().length > 0);
  readonly hasStudents = computed(() => this.students().length > 0);
  readonly isGradesLoading = computed(() => this.existingGradesState().status === 'loading');
  readonly isLoading = computed(() => this.subjectLoading() || this.studentsLoading() || this.isGradesLoading() || this.absencesLoading());
  readonly hasValidEnrollmentIds = computed(() =>
    this.gradeRowsDraft().every((row) => (row.enrollmentId?.trim().length ?? 0) > 0),
  );
  readonly saveableGradeCount = computed(() => this.buildSavePayload().grades.length);

  readonly isGradesLocked = computed(() => {
    const settings = this.globalSettings();
    if (!settings) {
      return false;
    }

    if (settings?.institutional?.allowLateGradesEntry) {
      return false;
    }

    const deadlineStr = settings?.academic?.globalGradesDeadline;
    if (!deadlineStr) {
      return false;
    }

    const currentDate = this.currentDate();
    const currentVal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();

    // Parse YYYY-MM-DD safely in local time
    const parts = deadlineStr.split('-');
    if (parts.length !== 3) {
      return false;
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const deadlineVal = new Date(year, month, day).getTime();

    return currentVal > deadlineVal;
  });

  readonly hasValidationErrors = computed(() => {
    const draft = this.gradeRowsDraft();
    const components = this.components();

    for (const row of draft) {
      if (!row.enrollmentId) {
        continue;
      }
      for (const component of components) {
        const value = row.scores[component.id];
        if (value !== null && Number.isFinite(value)) {
          if (value < 0 || value > component.weight) {
            return true;
          }
        }
      }
    }
    return false;
  });

  readonly canSave = computed(() =>
    this.hasComponents() &&
    this.hasStudents() &&
    this.saveableGradeCount() > 0 &&
    this.hasValidEnrollmentIds() &&
    !this.isLoading() &&
    !this.isSaving() &&
    !this.isGradesLocked() &&
    !this.hasValidationErrors(),
  );

  constructor() {
    this.settingsService.getGlobalSettings().subscribe({
      next: (settings) => {
        this.globalSettings.set(settings);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los parámetros de configuración global.', 'Configuración');
      }
    });

    effect(
      () => {
        const subjectId = this.routeSubjectId();

        this.isSaveModalOpen.set(false);
        this.gradeRowsDraft.set([]);
        this.initializedSubjectId.set(null);
        this.invalidEnrollmentToastSignature.set(null);

        if (!subjectId) {
          return;
        }

        untracked(() => {
          this.operationalService.loadSubjectContext(subjectId);
        });
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const subjectId = this.routeSubjectId();
        const students = this.students();
        const components = this.components();
        const gradeLoadState = this.existingGradesState();

        if (!subjectId || this.studentsLoading() || gradeLoadState.status === 'loading' || gradeLoadState.status === 'idle') {
          return;
        }

        if (this.initializedSubjectId() === subjectId) {
          return;
        }

        const draft = this.buildDraftRows(students, components, this.existingGradesMap());
        this.gradeRowsDraft.set(draft.rows);

        if (draft.invalidEnrollmentIds.length > 0) {
          const signature = draft.invalidEnrollmentIds.join('|');

          if (this.invalidEnrollmentToastSignature() !== signature) {
            this.toast.error(
              `Se omitieron ${draft.invalidEnrollmentIds.length} estudiante(s) sin ID de matrícula válido: ${draft.invalidEnrollmentIds.join(', ')}`,
              'Datos inválidos',
            );
            this.invalidEnrollmentToastSignature.set(signature);
          }
        }

        this.initializedSubjectId.set(subjectId);
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const contextError = this.operationalService.contextError();

        if (contextError) {
          this.toast.error(contextError, 'Carga de materia');
          this.operationalService.clearContextError();
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const message = this.operationalService.studentsError();

        if (message) {
          this.toast.error(message, 'Carga de estudiantes');
          this.operationalService.clearStudentsError();
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      (onCleanup) => {
        const subjectId = this.routeSubjectId();

        if (!subjectId) {
          this.absencesMap.set(new Map());
          this.absencesLoading.set(false);
          return;
        }

        this.absencesLoading.set(true);

        const subscription = this.attendanceService.getSubjectAbsences(subjectId).pipe(
          catchError((error) => {
            const message = this.extractErrorMessage(error, 'No se pudieron cargar las faltas. Se asumirá 0 por estudiante.');
            this.toast.warning(message, 'Faltas no disponibles');
            return of(new Map<string, number>());
          }),
        ).subscribe({
          next: (absences) => {
            this.absencesMap.set(absences);
          },
          complete: () => {
            this.absencesLoading.set(false);
          },
          error: () => {
            this.absencesLoading.set(false);
          },
        });

        onCleanup(() => subscription.unsubscribe());
      },
      { allowSignalWrites: true },
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

  onGradeChange(enrollmentId: string | null, componentId: number, value: string | number): void {
    if (enrollmentId === null) {
      return;
    }

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

  getCellValue(enrollmentId: string | null, componentId: number): string | number {
    if (enrollmentId === null) {
      return '';
    }

    const row = this.gradeRowsDraft().find((currentRow) => currentRow.enrollmentId === enrollmentId);
    const rawValue = row?.scores[componentId] ?? null;

    return rawValue ?? '';
  }

  isCellInvalid(enrollmentId: string | null, componentId: number): boolean {
    if (enrollmentId === null) {
      return false;
    }

    const row = this.gradeRowsDraft().find((currentRow) => currentRow.enrollmentId === enrollmentId);

    if (!row) {
      return false;
    }

    const value = row.scores[componentId];
    if (value === null) {
      return false;
    }

    const maxScore = this.components().find((c) => c.id === componentId)?.weight ?? 100;
    return !Number.isFinite(value) || value < 0 || value > maxScore;
  }

  private buildDraftRows(
    students: StudentOperational[],
    components: EvaluationComponent[],
    existingGradesMap: Map<string, number>,
  ): { rows: GradeRowUI[]; invalidEnrollmentIds: string[] } {
    const invalidEnrollmentIds: string[] = [];

    const rows = students.map((student) => {
      const enrollmentId = this.resolveEnrollmentId(student);
      const scores: Record<number, number | null> = {};

      for (const component of components) {
        const cellKey = enrollmentId !== null ? this.buildCellKey(enrollmentId, component.id) : null;
        scores[component.id] = cellKey !== null ? existingGradesMap.get(cellKey) ?? null : null;
      }

      if (enrollmentId === null) {
        invalidEnrollmentIds.push(student.studentId);
      }

      return {
        studentId: student.studentId,
        enrollmentId,
        studentName: student.fullName,
        ci: student.ci,
        degreeName: student.degreeName,
        scores,
        academicStatus: 'PENDIENTE' as GradeAcademicStatus,
      };
    });

    return { rows, invalidEnrollmentIds };
  }

  private buildSavePayload(): GradeBulkRequest {
    const grades: GradeRequest[] = [];

    for (const row of this.gradeRowsDraft()) {
      const enrollmentId = row.enrollmentId?.trim();

      if (!enrollmentId) {
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
          enrollmentId,
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

      return total + score;
    }, 0);
  }

  private resolveAcademicStatus(
    row: GradeRowUI,
    components: EvaluationComponent[],
    finalGrade: number,
    absencesMap: Map<string, number>,
    absenceLimit: number,
  ): GradeAcademicStatus {
    const absences = this.getAbsenceCount(row, absencesMap);

    if (absences >= absenceLimit) {
      return 'REPROBADO_POR_FALTAS';
    }

    if (!this.isRowComplete(row, components)) {
      return 'PENDIENTE';
    }

    if (finalGrade >= 51) {
      return 'APROBADO';
    }

    return 'REPROBADO';
  }

  private isRowComplete(row: GradeRowUI, components: EvaluationComponent[]): boolean {
    for (const component of components) {
      const score = row.scores[component.id];

      if (score === null || score === undefined) {
        return false;
      }
    }

    return true;
  }

  private getAbsenceCount(row: GradeRowUI, absencesMap: Map<string, number>): number {
    const enrollmentKey = row.enrollmentId?.trim();

    if (!enrollmentKey) {
      return 0;
    }

    return absencesMap.get(enrollmentKey) ?? 0;
  }

  private getAbsenceLimit(modality: SubjectModality | null): number {
    return modality === 'BLENDED' ? 3 : 5;
  }

  isStudentColumn(columnKey: string): boolean {
    return columnKey === 'student';
  }

  isFinalGradeColumn(columnKey: string): boolean {
    return columnKey === 'finalGrade';
  }

  isAcademicStatusColumn(columnKey: string): boolean {
    return columnKey === 'academicStatus';
  }

  isComponentColumn(columnKey: string): boolean {
    return columnKey.startsWith('component-');
  }

  getComponentIdFromColumnKey(columnKey: string): number {
    return Number(columnKey.replace('component-', ''));
  }

  getComponentMax(columnKey: string): number {
    const componentId = this.getComponentIdFromColumnKey(columnKey);
    const component = this.components().find((item) => item.id === componentId);

    return component?.weight ?? 100;
  }

  private getRowKey(row: GradeRowUI): string {
    return row.enrollmentId?.trim() || row.studentId;
  }

  private resolveEnrollmentId(student: StudentOperational): string | null {
    const enrollmentId = student.enrollmentId?.trim();
    const fallbackEnrollmentId = student.studentId?.trim();

    return enrollmentId || fallbackEnrollmentId || null;
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

  private buildCellKey(enrollmentId: string, componentId: number): string {
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

  goBack(): void {
    this.location.back();
  }
}
