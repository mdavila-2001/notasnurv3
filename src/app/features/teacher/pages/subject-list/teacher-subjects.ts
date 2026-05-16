import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminSubjectService, SubjectResponse } from '../../../admin/services/admin-subject.service';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../services/enrollment-api.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { EvaluationPlanTab } from '../subject-detail/tabs/evaluation-plan-tab/evaluation-plan-tab';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule, EvaluationPlanTab],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
  providers: [SubjectOperationalService, EvaluationPlanService]
})
export class TeacherSubjects implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly operationalService = inject(SubjectOperationalService);

  readonly allSubjects = signal<SubjectResponse[]>([]);
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = signal<StudentEnrolledResponse[]>([]);

  readonly activeTab = signal<'students' | 'evaluation'>('students');

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isResolvingProfile = signal(true);
  readonly errorMessage = signal('');

  readonly currentTeacherId = signal('');

  readonly mySubjects = computed(() => this.allSubjects());

  ngOnInit() {
    this.resolveTeacherContext();
  }

  resolveTeacherContext() {
    this.isResolvingProfile.set(true);
    this.errorMessage.set('');

    this.authService.getCurrentUserProfile().subscribe({
      next: (response) => {
        this.currentTeacherId.set(response.data.id);
        this.loadSubjects();
      },
      error: () => {
        this.isResolvingProfile.set(false);
        this.errorMessage.set('No se pudo identificar al docente autenticado.');
      },
    });
  }

  loadSubjects() {
    if (!this.currentTeacherId()) {
      this.resolveTeacherContext();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teacherService.getMySubjects()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.isResolvingProfile.set(false);
      }))
      .subscribe({
        next: (response) => this.allSubjects.set(response ?? []),
        error: () => this.errorMessage.set('Error al cargar las materias.'),
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.operationalService.setSubjectDirectly(subject); // Inyectamos la materia que ya tenemos
    this.operationalService.loadSubjectContext(subject.id); // Carga estudiantes y plan de evaluación
    this.loadStudents(subject.id);
  }

  setTab(tab: 'students' | 'evaluation') {
    this.activeTab.set(tab);
  }

  loadStudents(subjectId: string) {
    this.isLoadingStudents.set(true);
    this.enrollmentApi.getStudentsBySubject(subjectId)
      .pipe(finalize(() => this.isLoadingStudents.set(false)))
      .subscribe({
        next: (response) => this.enrolledStudents.set(response.data ?? []),
        error: () => this.enrolledStudents.set([]),
      });
  }
}
