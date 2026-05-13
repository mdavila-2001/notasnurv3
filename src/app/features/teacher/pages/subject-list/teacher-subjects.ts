import { Component, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../../core/services/auth/auth';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { EnrollmentService } from '../../../core/services/enrollment/enrollment';
import { Subject } from '../../../core/models/subject.model';
import { StudentResponseDTO } from '../../../core/models/enrollment.model';
import { Badge } from '../../../shared/components/badge/badge';
import { Loader } from '../../../shared/components/loader/loader';
import { Table } from '../../../shared/components/table/table'; // IMPORTANTE: Agregamos tu átomo de tabla

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, Badge, Loader, Table], // Lo registramos aquí
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
})
export class TeacherSubjectsComponent implements OnInit {
  private readonly authService = inject(Auth);
  private readonly subjectService = inject(SubjectService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly allSubjects = signal<Subject[]>([]);
  readonly selectedSubject = signal<Subject | null>(null);
  readonly enrolledStudents = signal<StudentResponseDTO[]>([]);
  readonly searchQuery = signal('');

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isResolvingProfile = signal(true);
  readonly errorMessage = signal('');

  readonly currentTeacherId = signal('');
  
  readonly mySubjects = computed(() =>
    this.currentTeacherId()
      ? this.allSubjects().filter(s => s.teacherId === this.currentTeacherId())
      : []
  );

  readonly filteredStudents = computed(() =>
    this.searchQuery().trim() === ''
      ? this.enrolledStudents()
      : this.enrolledStudents().filter(student =>
          student.fullName.toLowerCase().includes(this.searchQuery().toLowerCase())
        )
  );

  ngOnInit() {
    // CORRECCIÓN: Nos suscribimos directamente como una petición normal
    // Esto evita el NG0203 y el NG0100 de forma limpia.
    this.authService.getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (meResponse) => {
          if (meResponse?.data?.id) {
            this.currentTeacherId.set(meResponse.data.id);
            this.loadSubjects();
          } else {
            this.isResolvingProfile.set(false);
            this.errorMessage.set('No se pudo identificar al docente autenticado.');
          }
        },
        error: () => {
          this.isResolvingProfile.set(false);
          this.errorMessage.set('Error de conexión. Intente iniciar sesión nuevamente.');
        }
      });
  }

  loadSubjects() {
    if (!this.currentTeacherId()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.subjectService.getSubjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subjects) => {
          this.allSubjects.set(subjects);
          this.isLoading.set(false);
          this.isResolvingProfile.set(false);
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Error al cargar las materias.';
          this.errorMessage.set(msg);
          this.isLoading.set(false);
          this.isResolvingProfile.set(false);
        },
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.loadStudents(subject.id);
  }

  loadStudents(subjectId: string) {
    this.isLoadingStudents.set(true);
    this.errorMessage.set('');
    this.searchQuery.set('');
    
    this.enrollmentService.getStudentsBySubject(subjectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (students) => {
          this.enrolledStudents.set(students);
          this.isLoadingStudents.set(false);
        },
        error: (err: any) => {
          this.enrolledStudents.set([]);
          this.isLoadingStudents.set(false);
          if (err.status === 404) {
            this.errorMessage.set('No hay estudiantes inscritos en esta materia');
          } else {
            this.errorMessage.set(err?.error?.message || 'Error al cargar los estudiantes');
          }
        },
      });
  }

  getAcademicStatusType(status: string): 'info' | 'warning' | 'dark' {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('active') || statusLower.includes('activo')) {
      return 'info';
    }
    if (statusLower.includes('suspend') || statusLower.includes('suspendido') ||
        statusLower.includes('inactive') || statusLower.includes('inactivo')) {
      return 'warning';
    }
    
    return 'dark';
  }
}