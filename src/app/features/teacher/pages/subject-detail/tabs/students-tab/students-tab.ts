import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './students-tab.css',
  templateUrl: './students-tab.html'
})
export class StudentsTab {
  private readonly operationalService = inject(SubjectOperationalService);

  readonly students = this.operationalService.students;
  readonly isLoading = this.operationalService.isLoading;
}
