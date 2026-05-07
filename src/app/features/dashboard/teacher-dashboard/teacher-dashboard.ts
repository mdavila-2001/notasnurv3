import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { SubjectContextService } from '../../../core/services/subject-context/subject-context.service';
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

  subjects = signal<MySubject[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.contextService.resetContext();
    this.loadSubjects();
  }

  loadSubjects() {
    this.subjectService.getMySubjects().subscribe({
      next: (res) => {
        this.subjects.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectSubject(subject: MySubject) {
    this.contextService.setSubject(subject);
    this.router.navigate(['/teacher/subject', subject.id, 'students']);
  }
}
