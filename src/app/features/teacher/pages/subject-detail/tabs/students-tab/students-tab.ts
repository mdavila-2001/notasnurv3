import { Component, computed, inject, OnInit, signal, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Importa los servicios correctos
import { SubjectContextService } from '../../../../../../core/services/subject-context/subject-context.service';

// Importa los Átomos del equipo
import { Table } from '../../../../../../shared/components/table/table';
import { Input } from '../../../../../../shared/components/input/input';
import { Loader } from '../../../../../../shared/components/loader/loader';
import { Button } from '../../../../../../shared/components/button/button'; 
import { EnrollmentApiService } from '../../../../../../features/teacher/services/enrollment-api.service';

// Modelo
import { StudentResponseDTO } from '../../../../../../core/models/enrollment.model';

@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Table, Loader, Input, Button], 
  templateUrl: './students-tab.html',
  styleUrl: './students-tab.css'
})
export class StudentsTabComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentApiService);
  private readonly subjectContext = inject(SubjectContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly students = signal<StudentResponseDTO[]>([]);
  readonly isLoading = signal(true);
  readonly searchTerm = signal(''); 

  readonly filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allStudents = this.students();

    if (!term) return allStudents;

    return allStudents.filter(student => 
      student.fullName?.toLowerCase().includes(term) || 
      student.ci?.toLowerCase().includes(term)
    );
  });

  readonly tableColumns = [
    { 
      key: 'fullName', 
      label: 'Estudiante',
      cellTemplate: (student: StudentResponseDTO) => `
        <div class="student-cell">
          <div class="student-initials">${student.fullName ? student.fullName.charAt(0).toUpperCase() : 'U'}</div>
          <div class="student-info">
            <span class="student-name">${student.fullName}</span>
          </div>
        </div>
      `
    },
    { key: 'ci', label: 'C.I.' },
    { key: 'email', label: 'Email Institucional' },
    { 
      key: 'academicStatus', 
      label: 'Estado Académico',
      cellTemplate: (student: StudentResponseDTO) => {
        const statusMap: { [key: string]: { label: string, class: string } } = {
          'REGULAR': { label: 'Regular', class: 'regular' },
          'CONDICIONAL': { label: 'Condicional', class: 'condicional' },
          'RETIRADO': { label: 'Retirado', class: 'retirado' }
        };
        
        const rawStatus = student.academicStatus ? student.academicStatus.toUpperCase() : 'REGULAR';
        const status = statusMap[rawStatus] || { label: student.academicStatus || 'Regular', class: 'regular' };
        
        return `<span class="status-tag status-tag--${status.class}">${status.label}</span>`;
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      cellTemplate: () => `
        <button class="icon-btn">
          <span class="material-icons">more_vert</span>
        </button>
      `
    }
  ];

  constructor() {
    effect(() => {
      const subject = this.subjectContext.currentSubject();
      if (subject && subject.id) {
        // SOLUCIÓN AL ERROR NG0100: Retrasamos la carga un microsegundo 
        // para que Angular termine de dibujar el estado inicial en paz.
        setTimeout(() => {
          this.loadStudents(String(subject.id));
        });
      }
    }, { allowSignalWrites: true }); 
  }

  ngOnInit() {
  }

  refreshList() {
    const subject = this.subjectContext.currentSubject();
    if (subject && subject.id) {
      this.loadStudents(String(subject.id));
    }
  }

  loadStudents(subjectId: string) {
    this.isLoading.set(true);

    this.enrollmentService.getStudentsBySubject(subjectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
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