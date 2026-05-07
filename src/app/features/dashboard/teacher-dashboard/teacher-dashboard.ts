import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { SubjectContextService } from '../../../core/services/subject-context/subject-context.service';
import { Auth } from '../../../core/services/auth/auth';
import { MySubject } from '../../../core/models/my-subject.model';
import { Loader } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [CommonModule, Loader],
  standalone: true,
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css',
})
export class TeacherDashboard implements OnInit {
  private readonly subjectService = inject(SubjectService);
  private readonly contextService = inject(SubjectContextService);
  private readonly router = inject(Router);
  private readonly authService = inject(Auth);

  subjects = signal<MySubject[]>([]);
  isLoading = signal(true);
  userName = signal<string>('Docente');
  
  averageAttendance = signal<number>(94.2);
  pendingRecords = signal<number>(2);
  nextExamDate = signal<string>('14 OCT');

  ngOnInit() {
    this.userName.set(localStorage.getItem('fullName') || 'Docente');
    this.contextService.resetContext();
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading.set(true);
    this.authService.getMe().subscribe({
      next: (profileResp) => {
        const teacherId = profileResp.data.id;
        this.subjectService.getSubjects().subscribe({
          next: (allSubjects) => {
            const mySubjectsList = allSubjects
              .filter(s => s.teacherId === teacherId)
              .map(s => ({
                id: s.id.toString(),
                name: s.name,
                code: s.code,
                modality: s.modality === 'FACE_TO_FACE' ? 'PRESENCIAL' : 'SEMI_PRESENCIAL',
                studentCount: s.capacity || 0,
                semesterName: s.semesterName
              } as MySubject));
            this.subjects.set(mySubjectsList);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectSubject(subject: MySubject) {
    this.contextService.setSubject(subject);
    this.router.navigate(['/teacher/subject', subject.id, 'students']);
  }
}
