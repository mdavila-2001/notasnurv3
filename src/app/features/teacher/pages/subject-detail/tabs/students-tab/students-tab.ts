import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

/**
 * Pestaña de estudiantes (Hijo)
 * Cumple con SRP (Single Responsibility Principle): solo se encarga de renderizar la vista.
 * Toda la lógica de carga y estado proviene del SubjectOperationalService (Single Source of Truth).
 */
@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './students-tab.css',
  templateUrl: './students-tab.html'
})
export class StudentsTab {
  private readonly operationalService = inject(SubjectOperationalService);
  // Los datos fluyen mágicamente desde el cerebro central
  readonly students = this.operationalService.students;
  readonly isLoading = this.operationalService.isLoading;
}
