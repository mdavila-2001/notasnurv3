import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { EnrollmentService } from '../../../core/services/enrollment/enrollment';
import { MySubjectResponseDTO } from '../../../core/models/enrollment.model';

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-subjects.html',
  styleUrl: './student-subjects.css',
})
export class StudentSubjectsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  readonly mySubjects = signal<MySubjectResponseDTO[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit() {
    this.loadMySubjects();
  }

  loadMySubjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService.getMySubjects()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (subjects) => this.mySubjects.set(subjects),
        error: (err: any) => {
          const msg = err?.error?.message || 'Error al cargar tus materias matriculadas.';
          this.errorMessage.set(msg);
        },
      });
  }
}
