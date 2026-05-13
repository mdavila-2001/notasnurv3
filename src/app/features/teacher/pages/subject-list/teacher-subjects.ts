import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminSubjectService, SubjectResponse } from '../../../admin/services/admin-subject.service';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../services/enrollment-api.service';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
})
export class TeacherSubjectsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminSubjectService = inject(AdminSubjectService);
  private readonly enrollmentApi = inject(EnrollmentApiService);

  readonly allSubjects = signal<SubjectResponse[]>([]);
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = signal<StudentEnrolledResponse[]>([]);

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

    this.adminSubjectService.getAll()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.isResolvingProfile.set(false);
      }))
      .subscribe({
        next: (response) => this.allSubjects.set(response.data ?? []),
        error: () => this.errorMessage.set('Error al cargar las materias.'),
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.loadStudents(subject.id);
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