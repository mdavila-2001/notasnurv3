import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
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

  loadSubjectContext(subjectId: string) {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin({
      subject: this.adminSubjectService.getById(subjectId),
      students: this.enrollmentService.getStudentsBySubject(subjectId),
      plan: this.evaluationService.fetchPlan(subjectId)
    }).pipe(
      finalize(() => this._isLoading.set(false))
    ).subscribe({
      next: (res) => {
        console.log('SubjectOperationalService - Response:', res);
        
        // Extrae el subject del response
        const subjectData = res.subject?.data;
        if (subjectData) {
          this._subject.set(subjectData);
          console.log('Subject cargada:', subjectData);
        } else {
          console.warn('Subject data es null o undefined:', res.subject);
          this._error.set('No se pudo cargar la información de la materia.');
        }
        
        // Extrae los estudiantes
        const studentsData = res.students?.data ?? [];
        this._students.set(studentsData);
        console.log('Estudiantes cargados:', studentsData.length);
      },
      error: (err) => {
        this._error.set('No se pudo cargar la información de la materia.');
        console.error('Operational Error:', err);
      }
    });
  }

  clearStore() {
    this._subject.set(null);
    this._students.set([]);
    this.evaluationService.reset();
  }
}