import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TeacherService, TeacherDashboardData } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { SubjectContextService } from '../../../../core/services/subject-context/subject-context.service';
import { Loader } from '../../../../shared/components/loader/loader';

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

  subjects = signal<SubjectResponse[]>([]);
  dashboardData = signal<TeacherDashboardData | null>(null);
  isLoading = signal(true);
  userName = signal<string>('Docente');

  averageAttendance = signal<number>(0);
  pendingRecords = signal<number>(0);
  nextExamDate = signal<string>('—');
  averageGrade = signal<number>(0);

  ngOnInit() {
    this.userName.set(this.authService.getUserFullName() || 'Docente');
    this.contextService.resetContext();
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading.set(true);
    // Cargar materias primero
    this.teacherService.getMySubjects().subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        // Una vez tenemos las materias, cargamos el dashboard para el progreso y stats
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
          
          // Mapear stats principales
          this.averageAttendance.set(data.averageAttendance);
          this.pendingRecords.set(data.pendingActasCount);
          this.nextExamDate.set(data.nextExamDate || '—');
          this.averageGrade.set(data.averageCourseGrade);

          // Enriquecer materias con el progreso del dashboard
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
}
