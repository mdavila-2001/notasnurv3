import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const teacherRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    data: { role: 'TEACHER' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/teacher-dashboard').then(m => m.TeacherDashboard),
      },
      {
        path: 'subjects',
        loadComponent: () => import('./pages/subject-list/teacher-subjects').then(m => m.TeacherSubjects),
      },
      {
        path: 'subject/:subjectId/grades',
        loadComponent: () => import('./pages/subject-grades/grade-grid.component').then(m => m.GradeGridComponent),
      },
      {
        path: 'subject/:id',
        loadComponent: () => import('./pages/subject-detail/subject-detail').then(m => m.SubjectDetail),
        children: [
          { path: '', redirectTo: 'students', pathMatch: 'full' },
          {
            path: 'students',
            loadComponent: () => import('./pages/subject-detail/tabs/students-tab/students-tab').then(m => m.StudentsTab),
          },
        ]
      },
      {
        path: 'attendance-reports',
        loadComponent: () => import('./pages/teacher-attendance-report/teacher-attendance-report').then(m => m.TeacherAttendanceReport)
      },
      {
        path: 'grade-closing',
        loadComponent: () => import('./pages/teacher-grade-closing/teacher-grade-closing').then(m => m.TeacherGradeClosing)
      },
    ],
  },
];
