import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Auth } from '../../../core/services/auth/auth';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { EnrollmentService } from '../../../core/services/enrollment/enrollment';
import { Subject } from '../../../core/models/subject.model';
import { StudentResponseDTO } from '../../../core/models/enrollment.model';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
})
export class TeacherSubjectsComponent implements OnInit {
  private readonly authService = inject(Auth);
  private readonly subjectService = inject(SubjectService);
  private readonly enrollmentService = inject(EnrollmentService);

  readonly allSubjects = signal<Subject[]>([]);
  readonly selectedSubject = signal<Subject | null>(null);
  readonly enrolledStudents = signal<StudentResponseDTO[]>([]);

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isResolvingProfile = signal(true);
  readonly errorMessage = signal('');

  readonly currentTeacherId = signal('');

  // Filtra las materias que le pertenecen al docente actual por ID
  readonly mySubjects = computed(() =>
    this.currentTeacherId()
      ? this.allSubjects().filter(s => s.teacherId === this.currentTeacherId())
      : []
  );

  ngOnInit() {
    this.resolveTeacherContext();
  }

  resolveTeacherContext() {
    this.isResolvingProfile.set(true);
    this.errorMessage.set('');

    this.authService.getMe().subscribe({
      next: (response) => {
        this.currentTeacherId.set(response.data.id);
        this.loadSubjects();
      },
      error: (err: any) => {
        this.isResolvingProfile.set(false);
        this.errorMessage.set(err?.error?.message || 'No se pudo identificar al docente autenticado.');
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

    this.subjectService.getSubjects()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.isResolvingProfile.set(false);
      }))
      .subscribe({
        next: (subjects) => this.allSubjects.set(subjects),
        error: (err: any) => {
          const msg = err?.error?.message || 'Error al cargar las materias.';
          this.errorMessage.set(msg);
        },
      });
  }

  selectSubject(subject: Subject) {
    this.selectedSubject.set(subject);
    this.loadStudents(subject.id);
  }

  loadStudents(subjectId: number) {
    this.isLoadingStudents.set(true);
    this.enrollmentService.getStudentsBySubject(subjectId)
      .pipe(finalize(() => this.isLoadingStudents.set(false)))
      .subscribe({
        next: (students) => this.enrolledStudents.set(students),
        error: () => this.enrolledStudents.set([]),
      });
  }
}
