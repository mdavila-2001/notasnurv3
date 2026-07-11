import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { AttendanceService } from '../../services/attendance.service';
import { ReportService } from '../../services/report.service';

import { StudentsTab } from './tabs/students-tab/students-tab';
import { EvaluationPlanTab } from './tabs/evaluation-plan-tab/evaluation-plan-tab';
import { GradeGridComponent } from '../subject-grades/grade-grid.component';
import { AttendanceTab } from './tabs/attendance-tab/attendance-tab';
import { ReportsTab } from './tabs/reports-tab/reports-tab';
import { Button } from '../../../../shared/components/button/button';
import { ToastService } from '../../../../shared/services/toast.service';

type TabId = 'students' | 'evaluation-plan' | 'grades' | 'attendance' | 'reports';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [RouterModule, StudentsTab, EvaluationPlanTab, GradeGridComponent, AttendanceTab, ReportsTab, Button],
  templateUrl: './subject-detail.html',
  styleUrl: './subject-detail.css',
  providers: [
    SubjectOperationalService,
    EvaluationPlanService,
    AttendanceService,
    ReportService
  ]
})
export class SubjectDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly toast = inject(ToastService);

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

  constructor() {
    effect(
      () => {
        const contextError = this.operationalService.contextError();

        if (contextError) {
          this.toast.error(contextError, 'Carga de materia');
          this.operationalService.clearContextError();
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const studentsError = this.operationalService.studentsError();

        if (studentsError) {
          this.toast.error(studentsError, 'Carga de estudiantes');
          this.operationalService.clearStudentsError();
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (subjectId) {
      this.operationalService.loadSubjectContext(subjectId);
    }

    const tabParam = this.route.snapshot.queryParamMap?.get('tab');
    if (tabParam && ['students', 'evaluation-plan', 'grades', 'attendance', 'reports'].includes(tabParam)) {
      this.activeTab.set(tabParam as TabId);
    }
  }

  ngOnDestroy(): void {
    this.operationalService.clearStore();
  }

  goBack(): void {
    this.location.back();
  }
}