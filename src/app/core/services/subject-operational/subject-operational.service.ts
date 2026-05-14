import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';
import { EvaluationPlanService } from '../../../features/teacher/services/evaluation-plan.service';
import { StudentOperational } from '../../models/operational.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectOperationalService {
  private readonly enrollmentService = inject(EnrollmentApiService);
  private readonly evaluationService = inject(EvaluationPlanService);

  private readonly _students = signal<StudentOperational[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly students = computed(() => this._students());
  readonly evaluationPlan = this.evaluationService.plan;
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  loadSubjectContext(subjectId: string) {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin({
      students: this.enrollmentService.getStudentsBySubject(subjectId),
      plan: this.evaluationService.fetchPlan(subjectId)
    }).pipe(
      finalize(() => this._isLoading.set(false))
    ).subscribe({
      next: (res) => {
        this._students.set(res.students.data ?? []);
      },
      error: (err) => {
        this._error.set('No se pudo cargar la información de la materia.');
        console.error('Operational Error:', err);
      }
    });
  }

  clearStore() {
    this._students.set([]);
    this.evaluationService.reset();
  }
}
