import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { EnrollmentApiService, MySubjectResponse } from '../../../features/teacher/services/enrollment-api.service';

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-subjects.html',
  styleUrl: './student-subjects.css',
})
export class StudentSubjectsComponent implements OnInit {
  private readonly enrollmentApi = inject(EnrollmentApiService);

  readonly mySubjects = signal<MySubjectResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit() {
    this.loadMySubjects();
  }

  loadMySubjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentApi.getMySubjects()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => this.mySubjects.set(response.data ?? []),
        error: () => this.errorMessage.set('Error al cargar tus materias matriculadas.'),
      });
  }
}
