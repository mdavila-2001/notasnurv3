import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../services/enrollment-api.service';
import { SubjectContextService } from '../../../../core/services/subject-context/subject-context.service';

// Importamos solo los Átomos que SÍ existen
import { Table } from '../../../../shared/components/table/table';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  // Quitamos Badge de aquí también
  imports: [CommonModule, Table, Button, Loader],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
})
export class TeacherSubjects implements OnInit {
  // Inyecciones
  private readonly authService = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly router = inject(Router);
  private readonly contextService = inject(SubjectContextService);

  // Signals
  readonly mySubjects = signal<SubjectResponse[]>([]); 
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = signal<StudentEnrolledResponse[]>([]);

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly errorMessage = signal('');

  // Columnas para la tabla de pre-visualización
  readonly previewColumns = [
    { key: 'fullName', label: 'Nombre Completo' },
    { key: 'ci', label: 'C.I.' }
  ];

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teacherService.getMySubjects()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (subjects) => {
          this.mySubjects.set(subjects || []);
        },
        error: () => {
          this.errorMessage.set('Error al cargar las materias asignadas.');
        },
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.loadStudents(String(subject.id));
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

    this.contextService.setSubject({
      id: currentSubj.id,
      name: currentSubj.name,
      code: currentSubj.code,
      modality: currentSubj.modality,
      studentCount: currentSubj.capacity ?? 0,
      semesterName: currentSubj.semesterName ?? '',
    });

    this.router.navigate(['/teacher/subject', currentSubj.id, 'students']);
  }
}