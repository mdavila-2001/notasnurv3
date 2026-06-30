import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importa los servicios correctos
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

// Importa los Átomos del equipo
import { Table } from '../../../../../../shared/components/table/table';
import { Input } from '../../../../../../shared/components/input/input';
import { Loader } from '../../../../../../shared/components/loader/loader';
import { Button } from '../../../../../../shared/components/button/button'; 

@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Table, Loader, Input, Button], 
  templateUrl: './students-tab.html',
  styleUrl: './students-tab.css'
})
export class StudentsTab {
  private readonly operationalService = inject(SubjectOperationalService);

  // Estados de carga y lista completa desde el Store
  readonly isLoading = this.operationalService.isLoading;
  readonly students = this.operationalService.students;

  // Buscador reactivo
  readonly searchTerm = signal<string>('');

  // Filtro de estudiantes basado en la búsqueda
  readonly filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allStudents = this.students(); // Usamos la señal que declaramos arriba
    
    if (!term) return allStudents;
    
    return allStudents.filter(student => 
      student.fullName.toLowerCase().includes(term) || 
      (student.ci && student.ci.toLowerCase().includes(term))
    );
  });

  // Columnas de la tabla
  readonly tableColumns = [
    { key: 'fullName', label: 'Nombre Completo' },
    { key: 'ci', label: 'C.I.' },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'degreeName', label: 'Carrera' }
  ];

  // Acciones
  refreshList(): void {
    const currentSubject = this.operationalService.subject();
    if (currentSubject) {
      this.operationalService.loadSubjectContext(String(currentSubject.id));
    }
  }

  updateSearch(term: string | number): void {
    this.searchTerm.set(String(term));
  }
}