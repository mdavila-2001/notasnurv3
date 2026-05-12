import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrollmentApiService, StudentEnrolledResponse } from '../../../services/enrollment-api.service';

@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="students-tab">
      <div class="tab-header">
        <h2>Estudiantes Inscritos</h2>
        <span class="count-badge">{{ students().length }} alumnos</span>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined spinning">progress_activity</span>
          <p>Cargando estudiantes...</p>
        </div>
      } @else if (students().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">person_search</span>
          <p>No hay estudiantes inscritos en esta materia</p>
        </div>
      } @else {
        <div class="table-wrapper">
          <table class="students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre Completo</th>
                <th>CI</th>
                <th>Correo</th>
                <th>Carrera</th>
              </tr>
            </thead>
            <tbody>
              @for (student of students(); track student.studentId; let i = $index) {
                <tr>
                  <td class="row-number">{{ i + 1 }}</td>
                  <td class="student-name">{{ student.fullName }}</td>
                  <td>{{ student.ci }}</td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.degreeName || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .students-tab { padding: 1rem 0; }
    .tab-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .tab-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--primary-color, #002131); }
    .count-badge {
      font-size: 0.75rem; font-weight: 600;
      padding: 0.25rem 0.75rem; border-radius: 9999px;
      background-color: #e0f2fe; color: #0369a1;
    }
    .table-wrapper { overflow-x: auto; border-radius: 0.75rem; border: 1px solid #e5e7eb; }
    .students-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .students-table th {
      text-align: left; padding: 0.75rem 1rem;
      background-color: #f9fafb; color: #374151;
      font-weight: 600; border-bottom: 1px solid #e5e7eb;
    }
    .students-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
    .students-table tr:last-child td { border-bottom: none; }
    .students-table tr:hover td { background-color: #f9fafb; }
    .row-number { color: #9ca3af; width: 3rem; }
    .student-name { font-weight: 500; color: #111827; }
    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 4rem 0; color: #9ca3af; gap: 0.75rem;
    }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
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
