import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { EvaluationPlanTab } from '../subject-detail/tabs/evaluation-plan-tab/evaluation-plan-tab';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule, EvaluationPlanTab, Button, Loader],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
  providers: [EvaluationPlanService] // SubjectOperationalService ya es root
})
export class TeacherSubjects implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly allSubjects = signal<SubjectResponse[]>([]);
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = this.operationalService.students;

  readonly activeTab = signal<'students' | 'evaluation'>('students');

  readonly isLoading = signal(false);
  readonly isResolvingProfile = signal(true);
  readonly errorMessage = signal('');

  readonly currentTeacherId = signal('');

  readonly mySubjects = computed(() => this.allSubjects());
  readonly isLoadingStudents = computed(() => this.operationalService.studentsLoading());

  constructor() {
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
      .subscribe({
        next: (response) => this.allSubjects.set(response ?? []),
        error: () => {
          this.errorMessage.set('Error al cargar las materias.');
          this.isLoading.set(false);
          this.isResolvingProfile.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
          this.isResolvingProfile.set(false);
        },
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.operationalService.setSubjectDirectly(subject);
    this.loadStudents(subject.id);
  }

  setTab(tab: 'students' | 'evaluation') {
    this.activeTab.set(tab);
  }

  openGrades(subject: SubjectResponse) {
    this.selectSubject(subject);
    this.router.navigate(['/teacher/subject', subject.id, 'grades']);
  }

  loadStudents(subjectId: string) {
    void this.operationalService.loadStudents(subjectId);
  }
}