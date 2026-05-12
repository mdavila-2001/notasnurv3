import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { AdminSubjectService } from '../../../admin/services/admin-subject.service';
import { StudentsTabComponent } from './tabs/students-tab';
import { EvaluationPlanTabComponent } from './tabs/evaluation-plan-tab';
import { GradeEntryTabComponent } from './tabs/grade-entry-tab';
import { AttendanceTabComponent } from './tabs/attendance-tab';
import { ReportsTabComponent } from './tabs/reports-tab';

type TabId = 'students' | 'evaluation-plan' | 'grades' | 'attendance' | 'reports';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, StudentsTabComponent, EvaluationPlanTabComponent, GradeEntryTabComponent, AttendanceTabComponent, ReportsTabComponent],
  template: `
    <div class="subject-detail">
      @if (isLoading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined spinning">progress_activity</span>
          <p>Cargando materia...</p>
        </div>
      } @else {
        <header class="detail-header">
          <div>
            <h1>{{ subject()?.name }}</h1>
            <p class="subject-meta">
              {{ subject()?.code }} · {{ subject()?.semesterName }}
            </p>
          </div>
        </header>

        <nav class="tab-bar">
          @for (tab of tabs; track tab.id) {
            <button
              class="tab-btn"
              [class.active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
            >
              <span class="material-symbols-outlined">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          }
        </nav>

        <section class="tab-content">
          @switch (activeTab()) {
            @case ('students') {
              <app-students-tab [subjectId]="subject()!.id" />
            }
            @case ('evaluation-plan') {
              <app-evaluation-plan-tab [subjectId]="subject()!.id" />
            }
            @case ('grades') {
              <app-grade-entry-tab [subjectId]="subject()!.id" />
            }
            @case ('attendance') {
              <app-attendance-tab [subjectId]="subject()!.id" />
            }
            @case ('reports') {
              <app-reports-tab [subjectId]="subject()!.id" />
            }
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .subject-detail { padding: 1.5rem; }
    .detail-header { margin-bottom: 2rem; }
    .detail-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0; color: var(--primary-color, #002131); }
    .subject-meta { font-size: 0.875rem; color: var(--text-secondary, #6b7280); margin: 0.25rem 0 0 0; }
    .tab-bar { display: flex; gap: 0.25rem; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem; }
    .tab-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.25rem; border: none; background: transparent;
      font-size: 0.875rem; font-weight: 600; color: #6b7280;
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--primary-color, #002131); }
    .tab-btn.active { color: var(--primary-color, #002131); border-bottom-color: var(--primary-color, #002131); }
    .tab-btn .material-symbols-outlined { font-size: 1.125rem; }
    .tab-content { min-height: 300px; }
    .placeholder-tab {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem 0; color: #9ca3af; gap: 0.75rem;
    }
    .placeholder-tab .material-symbols-outlined { font-size: 2.5rem; opacity: 0.5; }
    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 4rem 0; color: #6b7280; gap: 1rem; }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class SubjectDetailComponent implements OnInit {
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
