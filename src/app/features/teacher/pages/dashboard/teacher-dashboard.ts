import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { SubjectContextService } from '../../../../core/services/subject-context/subject-context.service';
import { Loader } from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [Loader],
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
  isLoading = signal(true);
  userName = signal<string>('Docente');

  averageAttendance = signal<number>(0);
  pendingRecords = signal<number>(0);
  nextExamDate = signal<string>('—');

  ngOnInit() {
    this.userName.set(this.authService.getUserFullName() || 'Docente');
    this.contextService.resetContext();
    this.loadSubjects();
    this.loadDashboard();
  }

  loadSubjects() {
    this.isLoading.set(true);
    this.teacherService.getMySubjects().subscribe({
      next: (response) => {
        this.subjects.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadDashboard() {
    this.teacherService.getDashboard().subscribe({
      next: (response) => {
        if (response.data) {
          this.averageAttendance.set(response.data.averageAttendance);
          this.pendingRecords.set(response.data.pendingRecords);
        }
      },
      error: () => {},
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
