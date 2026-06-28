import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TeacherService, TeacherDashboardData } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { SubjectContextService } from '../../../../core/services/subject-context/subject-context.service';
import { Loader } from '../../../../shared/components/loader/loader';
import { AcademicManagementService } from '../../../../core/services/academic-management/academic-management.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [CommonModule, Loader],
  standalone: true,
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css',
})
export class TeacherDashboard implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly contextService = inject(SubjectContextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly academicService = inject(AcademicManagementService);

  subjects = signal<SubjectResponse[]>([]);
  dashboardData = signal<TeacherDashboardData | null>(null);
  isLoading = signal(true);
  userName = signal<string>('Docente');
  academicPeriod = signal<string>('Vacaciones');

  pendingRecords = signal<number>(0);
  averageGrade = signal<number>(0);

  ngOnInit() {
    this.userName.set(this.authService.getUserFullName() || 'Docente');
    this.contextService.resetContext();
    this.loadAllData();
    this.loadAcademicPeriod();
  }

  loadAcademicPeriod() {
    this.academicService.getSemesters().subscribe({
      next: (semesters) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = semesters.find(s => {
          const start = new Date(s.startDate + 'T00:00:00');
          const end   = new Date(s.endDate   + 'T23:59:59');
          return today >= start && today <= end;
        });

        if (active) {
          this.academicPeriod.set(`Periodo Académico ${active.managementYear}-${active.number}`);
        } else {
          this.academicPeriod.set('Vacaciones');
        }
      },
      error: (err) => {
        console.error('[TeacherDashboard] Error al obtener periodos académicos:', err);
        this.academicPeriod.set('Vacaciones');
      }
    });
  }

  loadAllData() {
    this.isLoading.set(true);
    this.teacherService.getMySubjects().subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        this.loadDashboard();
      },
      error: (err) => {
        console.error('[TeacherDashboard] Error al cargar materias:', err);
        this.isLoading.set(false);
      },
    });
  }

  loadDashboard() {
    this.teacherService.getDashboard().subscribe({
      next: (response) => {
        if (response.data) {
          const data = response.data;
          this.dashboardData.set(data);
          
          this.pendingRecords.set(data.pendingActasCount);
          this.averageGrade.set(data.averageCourseGrade);

          if (data.subjects && data.subjects.length > 0) {
            const enrichedSubjects = this.subjects().map(s => {
              const summary = data.subjects.find(ds => ds.id === Number(s.id));
              return summary ? { ...s, progressPercentage: summary.progressPercentage } : s;
            });
            this.subjects.set(enrichedSubjects);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[TeacherDashboard] Error al cargar datos del dashboard:', err);
        this.isLoading.set(false);
      },
    });
  }

  selectSubject(subject: SubjectResponse) {
    this.contextService.setSubject({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      modality: subject.modality,
      studentCount: subject.capacity ?? 0,
      semesterName: subject.semesterName ?? '',
    });
    this.router.navigate(['/teacher/subject', subject.id, 'students']);
  }

  openGrades(subject: SubjectResponse) {
    this.router.navigate(['/teacher/subject', subject.id, 'grades']);
  }
}
