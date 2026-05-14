import { Component, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Importa los servicios correctos
import { SubjectContextService } from '../../../../../core/services/subject-context/subject-context.service'; // El contexto de Marcelo

// Importa los Átomos del equipo
import { Table } from '../../../../../shared/components/table/table';
import { Input } from '../../../../../shared/components/input/input';
import { Loader } from '../../../../../shared/components/loader/loader';
import { EnrollmentApiService } from '../../../../../features/teacher/services/enrollment-api.service';

// Modelo
import { StudentResponseDTO } from '../../../../../core/models/enrollment.model';

@Component({
  selector: 'app-students-tab',
  standalone: true,
  // OJO: Ya no está Badge aquí para que no rompa la compilación
  imports: [CommonModule, FormsModule, Table, Input, Loader],
  templateUrl: './students-tab.html' 
})
export class StudentsTabComponent implements OnInit {
  // 1. Inyección de dependencias (Cero Inputs)
private readonly enrollmentService = inject(EnrollmentApiService);
  private readonly subjectContext = inject(SubjectContextService);
  private readonly destroyRef = inject(DestroyRef);

  // 2. Estado (Signals)
 readonly students = signal<StudentResponseDTO[]>([]);
  readonly isLoading = signal(true);
  readonly searchTerm = signal(''); // Signal para el input de búsqueda

  // 3. Reactividad (El requerimiento Senior de Marcelo)
  readonly filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allStudents = this.students();

    if (!term) return allStudents;

    return allStudents.filter(student => 
      student.fullName.toLowerCase().includes(term) || 
      student.ci.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.loadStudents();
  }

  private loadStudents() {
    // Obtenemos el ID del contexto global de Marcelo
const currentSubjectId = this.subjectContext.currentSubject()?.id; 

    if (!currentSubjectId) return;

    this.isLoading.set(true);

    this.enrollmentService.getStudentsBySubject(currentSubjectId)
      // Evita fugas de memoria (DoD check)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.students.set(response.data ?? []);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.students.set([]);
        },
      });
  }
}