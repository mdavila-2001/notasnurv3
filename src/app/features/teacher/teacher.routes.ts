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
        loadComponent: () => import('./pages/subject-list/teacher-subjects').then(m => m.TeacherSubjectsComponent),
      },
      {
        path: 'subject/:id',
        loadComponent: () => import('./pages/subject-detail/subject-detail').then(m => m.SubjectDetailComponent),
      },
    ],
  },
];
