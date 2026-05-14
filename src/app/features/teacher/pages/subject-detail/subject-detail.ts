import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SubjectResponse, AdminSubjectService } from '../../../admin/services/admin-subject.service';
import { StudentsTab } from './tabs/students-tab/students-tab';
import { EvaluationPlanTab } from './tabs/evaluation-plan-tab/evaluation-plan-tab';
import { GradeEntryTab } from './tabs/grade-entry-tab/grade-entry-tab';
import { AttendanceTab } from './tabs/attendance-tab/attendance-tab';
import { ReportsTab } from './tabs/reports-tab/reports-tab';
import { Button } from '../../../../shared/components/button/button';

type TabId = 'students' | 'evaluation-plan' | 'grades' | 'attendance' | 'reports';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [RouterModule, StudentsTab, EvaluationPlanTab, GradeEntryTab, AttendanceTab, ReportsTab, Button],
  templateUrl: './subject-detail.html',
  styleUrl: './subject-detail.css'
})
export class SubjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly subjectService = inject(AdminSubjectService);

  readonly tabs: Tab[] = [
    { id: 'students', label: 'Estudiantes', icon: 'group' },
    { id: 'evaluation-plan', label: 'Plan Evaluación', icon: 'assignment' },
    { id: 'grades', label: 'Notas', icon: 'edit_note' },
    { id: 'attendance', label: 'Asistencia', icon: 'how_to_reg' },
    { id: 'reports', label: 'Reportes', icon: 'description' },
  ];

  readonly activeTab = signal<TabId>('students');
  readonly subject = signal<SubjectResponse | null>(null);
  readonly isLoading = signal(true);

  ngOnInit() {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (subjectId) {
      this.subjectService.getById(subjectId).subscribe({
        next: (response) => {
          this.subject.set(response.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }
}
