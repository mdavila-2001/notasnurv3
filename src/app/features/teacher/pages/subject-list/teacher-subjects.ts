import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { TeacherService } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { Table } from '../../../../shared/components/table/table';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';
import { EvaluationPlanTab } from '../subject-detail/tabs/evaluation-plan-tab/evaluation-plan-tab';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule, Table, Button, Loader, EvaluationPlanTab],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
  providers: [EvaluationPlanService]
})
export class TeacherSubjects implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly router = inject(Router);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly toast = inject(ToastService);

  readonly allSubjects = signal<SubjectResponse[]>([]);
  readonly selectedSubject = signal<SubjectResponse | null>(null);

  readonly activeTab = signal<'students' | 'evaluation'>('students');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly mySubjects = computed(() => this.allSubjects());
  readonly isLoadingStudents = computed(() => this.operationalService.studentsLoading());
  readonly enrolledStudents = computed(() => this.operationalService.students());
  readonly previewColumns = [
    { key: 'fullName', label: 'Nombre Completo' },
    { key: 'ci', label: 'C.I.' },
  ];

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
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teacherService
      .getMySubjects()
      .pipe(finalize(() => {
        this.isLoading.set(false);
      }))
      .subscribe({
        next: (subjects) => {
          this.allSubjects.set(subjects || []);
        },
        error: () => {
          this.errorMessage.set('Error al cargar las materias asignadas.');
        },
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.operationalService.setSubjectDirectly(subject);
    this.operationalService.loadSubjectContext(String(subject.id));
  }

  setTab(tab: 'students' | 'evaluation') {
    this.activeTab.set(tab);
  }

  goToFullNomina() {
    const currentSubj = this.selectedSubject();
    if (!currentSubj) return;

    this.router.navigate(['/teacher/subject', currentSubj.id, 'students']);
  }
}