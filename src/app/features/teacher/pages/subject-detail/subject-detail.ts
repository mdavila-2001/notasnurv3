import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { AttendanceService } from '../../services/attendance.service';
import { GradeService } from '../../services/grade.service';
import { ReportService } from '../../services/report.service';
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
  styleUrl: './subject-detail.css',
  providers: [
    SubjectOperationalService,
    EvaluationPlanService,
    AttendanceService,
    GradeService,
    ReportService
  ]
})
export class SubjectDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly operationalService = inject(SubjectOperationalService);

  readonly tabs: Tab[] = [
    { id: 'students', label: 'Estudiantes', icon: 'group' },
    { id: 'evaluation-plan', label: 'Plan Evaluación', icon: 'assignment' },
    { id: 'grades', label: 'Notas', icon: 'edit_note' },
    { id: 'attendance', label: 'Asistencia', icon: 'how_to_reg' },
    { id: 'reports', label: 'Reportes', icon: 'description' },
  ];

  readonly activeTab = signal<TabId>('students');
  readonly subject = this.operationalService.subject;
  readonly isLoading = this.operationalService.isLoading;

  ngOnInit() {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (subjectId) {
      this.operationalService.loadSubjectContext(subjectId);
    }
  }

  ngOnDestroy() {
    this.operationalService.clearStore();
  }
}
