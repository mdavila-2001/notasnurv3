import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../../../services/enrollment-api.service';

@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './students-tab.css',
  templateUrl: './students-tab.html'
})
export class StudentsTabComponent implements OnInit {
  readonly subjectId = input.required<string>();

  private readonly enrollmentApi = inject(EnrollmentApiService);

  readonly students = signal<StudentEnrolledResponse[]>([]);
  readonly isLoading = signal(true);

  ngOnInit() {
    this.loadStudents();
  }

  private loadStudents() {
    this.isLoading.set(true);
    this.enrollmentApi.getStudentsBySubject(this.subjectId()).subscribe({
      next: (response) => {
        this.students.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
