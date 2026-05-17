import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../services/enrollment-api.service';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { Table } from '../../../../shared/components/table/table';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule, Table, Button, Loader],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
  providers: [SubjectOperationalService, EvaluationPlanService]
})
export class TeacherSubjects implements OnInit {
  // Inyecciones
  private readonly authService = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly router = inject(Router);
  private readonly operationalService = inject(SubjectOperationalService);

  // Signals
  readonly allSubjects = signal<SubjectResponse[]>([]); 
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = signal<StudentEnrolledResponse[]>([]);

  readonly activeTab = signal<'students' | 'evaluation'>('students');

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isResolvingProfile = signal(false);
  readonly errorMessage = signal('');

  // Columnas para la tabla de pre-visualización
  readonly previewColumns = [
    { key: 'fullName', label: 'Nombre Completo' },
    { key: 'ci', label: 'C.I.' }
  ];

  readonly mySubjects = computed(() => this.allSubjects());

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teacherService.getMySubjects()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.isResolvingProfile.set(false);
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
    this.operationalService.setSubjectDirectly(subject); // Inyectamos la materia que ya tenemos
    this.operationalService.loadSubjectContext(String(subject.id)); // Carga estudiantes y plan de evaluación
    this.loadStudents(String(subject.id));
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

  goToFullNomina() {
    const currentSubj = this.selectedSubject();
    if (!currentSubj) return;

    this.router.navigate(['/teacher/subject', currentSubj.id, 'students']);
  }
}