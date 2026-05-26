import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Layout } from './core/layout/layout';
import { StudentSubjectsComponent } from './pages/student/student-subjects/student-subjects';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
      },

      // === Teacher (lazy-loaded, role-protected) ===
      {
        path: 'teacher',
        loadChildren: () => import('./features/teacher/teacher.routes').then(m => m.teacherRoutes),
      },

      {
        path: 'student',
        children: [
          { path: 'subjects', component: StudentSubjectsComponent },
          {
            path: 'dashboard',
            loadComponent: () => import('./pages/student/student-portal/student-portal').then(m => m.StudentPortal)
          },
          {
            path: 'subject/:id',
            loadComponent: () => import('./pages/student/student-subject-detail/student-subject-detail').then(m => m.StudentSubjectDetail)
          },
          {
            path: 'attendance',
            loadComponent: () => import('./pages/student/student-attendance/student-attendance').then(m => m.StudentAttendance)
          },
          {
            path: 'schedule',
            loadComponent: () => import('./pages/student/student-schedule/student-schedule').then(m => m.StudentSchedule)
          }
        ]
      },
      { path: 'dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },

      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.Settings)
      },
    ]
  },

  { path: 'login', component: Login },
  { path: '**', redirectTo: 'login' }
];

