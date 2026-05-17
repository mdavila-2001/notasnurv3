import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, finalize, of, catchError } from 'rxjs';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';
import { EvaluationPlanService } from '../../../features/teacher/services/evaluation-plan.service';
import { AdminSubjectService, SubjectResponse } from '../../../features/admin/services/admin-subject.service';
import { StudentOperational } from '../../models/operational.model';

@Injectable()
export class SubjectOperationalService {
  private readonly enrollmentService = inject(EnrollmentApiService);
  private readonly evaluationService = inject(EvaluationPlanService);
  private readonly adminSubjectService = inject(AdminSubjectService);

  private readonly _subject = signal<SubjectResponse | null>(null);
  private readonly _students = signal<StudentOperational[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly subject = computed(() => this._subject());
  readonly students = computed(() => this._students());
  readonly evaluationPlan = this.evaluationService.plan;
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  /**
   * Inyecta la materia directamente sin hacer petición HTTP.
   * Útil cuando ya tenemos los datos de la materia (ej. desde la lista de "Mis Materias").
   */
  setSubjectDirectly(subject: SubjectResponse): void {
    this._subject.set(subject);
  }

  loadSubjectContext(subjectId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin({
      subject: this._subject()
        ? of(null) // Ya tenemos la materia, no re-pedirla
        : this.adminSubjectService.getById(subjectId).pipe(
            catchError((err) => { console.warn('Error cargando materia:', err); return of(null); })
          ),
      students: this.enrollmentService.getStudentsBySubject(subjectId).pipe(
        catchError((err) => { console.warn('Error cargando estudiantes:', err); return of(null); })
      ),
      plan: this.evaluationService.fetchPlan(subjectId).pipe(
        catchError((err) => { console.warn('Error cargando plan:', err); return of(null); })
      )
    }).pipe(
      finalize(() => this._isLoading.set(false))
    ).subscribe({
      next: (res) => {
        if (res.subject && 'data' in res.subject) {
          this._subject.set(res.subject.data ?? null);
        }
        if (res.students && 'data' in res.students) {
          this._students.set(res.students.data ?? []);
        }
      },
      error: (err) => {
        this._error.set('No se pudo cargar la información de la materia.');
        console.error('Operational Error:', err);
      }
    });
  }

  clearStore(): void {
    this._subject.set(null);
    this._students.set([]);
    this.evaluationService.reset();
  }
}
