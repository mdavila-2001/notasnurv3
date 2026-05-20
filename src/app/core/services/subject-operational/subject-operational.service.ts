import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, finalize, of, catchError, firstValueFrom, map } from 'rxjs';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../../features/teacher/services/enrollment-api.service';
import { EvaluationPlanService } from '../../../features/teacher/services/evaluation-plan.service';
import { AdminSubjectService, SubjectResponse } from '../../../features/admin/services/admin-subject.service';
import { StudentOperational } from '../../models/operational.model';

@Injectable({ providedIn: 'root' })
export class SubjectOperationalService {
  private readonly enrollmentService = inject(EnrollmentApiService);
  private readonly evaluationService = inject(EvaluationPlanService);
  private readonly adminSubjectService = inject(AdminSubjectService);

  private readonly _subject = signal<SubjectResponse | null>(null);
  private readonly _students = signal<StudentOperational[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _studentsLoading = signal<boolean>(false);
  private readonly _contextError = signal<string | null>(null);
  private readonly _studentsError = signal<string | null>(null);
  private readonly _loadedStudentsSubjectId = signal<string | null>(null);
  private _studentsRequestId = 0;
  private _studentsRequestedSubjectId: string | null = null;

  readonly subject = computed(() => this._subject());
  readonly students = computed(() => this._students());
  readonly currentSubjectId = computed(() => this._subject()?.id?.toString() ?? null);
  readonly evaluationPlan = this.evaluationService.plan;
  readonly isLoading = computed(() => this._isLoading() || this._studentsLoading());
  readonly studentsLoading = computed(() => this._studentsLoading());
  readonly contextError = computed(() => this._contextError());
  readonly studentsError = computed(() => this._studentsError());

  private mapStudentResponse(student: StudentEnrolledResponse): StudentOperational {
    const studentId = student.studentId ?? student.id ?? '';
    const rawEnrollmentId = student.id ?? student.studentId;
    const enrollmentId = rawEnrollmentId?.trim() || undefined;
    const fullName = student.fullName
      ?? student.name
      ?? [student.firstName, student.lastName].filter(Boolean).join(' ')
      ?? '';

    return {
      studentId,
      enrollmentId,
      fullName,
      ci: student.ci,
      email: student.email,
      degreeName: student.degreeName ?? student.degreeNameDto,
    };
  }

  setSubjectDirectly(subject: SubjectResponse): void {
    this._subject.set(subject);
  }

  loadSubjectContext(subjectId: string): void {
    this._isLoading.set(true);
    this._contextError.set(null);

    void this.loadStudents(subjectId);

    const shouldLoadSubject = this._subject()?.id?.toString() !== subjectId;

    forkJoin({
      subject: shouldLoadSubject
        ? this.adminSubjectService.getById(subjectId).pipe(
            catchError((err) => {
              void err;
              this._contextError.set('No se pudo cargar la materia de esta pantalla.');
              return of(null);
            }),
          )
        : of(null),
      plan: this.evaluationService.fetchPlan(subjectId).pipe(
        catchError((err) => {
          void err;
          this._contextError.set('No se pudo cargar el plan de evaluación.');
          return of(null);
        }),
      ),
    })
      .pipe(finalize(() => this._isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.subject && 'data' in res.subject) {
            this._subject.set(res.subject.data ?? null);
          }
        },
        error: (err) => {
          void err;
          this._contextError.set('No se pudo cargar la información de la materia.');
        },
      });
  }

  async loadStudents(subjectId: string, force = false): Promise<void> {
    if (!subjectId) {
      this._students.set([]);
      this._studentsError.set(null);
      this._loadedStudentsSubjectId.set(null);
      return;
    }

    if (!force && this._studentsLoading()) {
      this._studentsError.set(null);

      if (this._studentsRequestedSubjectId === subjectId) {
        return;
      }
    }

    if (!force && this._loadedStudentsSubjectId() === subjectId && !this._studentsError()) {
      return;
    }
    const requestId = ++this._studentsRequestId;
    this._studentsRequestedSubjectId = subjectId;
    this._studentsLoading.set(true);
    this._studentsError.set(null);

    try {
      const students = await firstValueFrom(
        this.enrollmentService.getStudentsBySubject(subjectId).pipe(
          map((response) => response.data ?? []),
        ),
      );

      if (requestId !== this._studentsRequestId) {
        return;
      }

      const mappedStudents = students.map((student) => this.mapStudentResponse(student));

      this._students.set(mappedStudents);
      this._loadedStudentsSubjectId.set(subjectId);
    } catch {
      if (requestId !== this._studentsRequestId) {
        return;
      }

      this._students.set([]);
      this._studentsError.set('No se pudieron cargar los estudiantes de esta materia.');
      this._loadedStudentsSubjectId.set(null);
    } finally {
      if (requestId === this._studentsRequestId) {
        this._studentsLoading.set(false);
        this._studentsRequestedSubjectId = null;
      }
    }
  }

  setStudentsDirectly(students: StudentOperational[]): void {
    this._students.set(students);
    this._studentsError.set(null);
  }

  clearContextError(): void {
    this._contextError.set(null);
  }

  clearStudentsError(): void {
    this._studentsError.set(null);
  }

  clearStore(): void {
    this._subject.set(null);
    this._students.set([]);
    this._isLoading.set(false);
    this._studentsLoading.set(false);
    this._contextError.set(null);
    this._studentsError.set(null);
    this._loadedStudentsSubjectId.set(null);
    this.evaluationService.reset();
  }
}
