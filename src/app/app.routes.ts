import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Layout } from './core/layout/layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Users } from './features/users/users';
import { ManagementListComponent } from './pages/academic-management/management-list/management-list';
import { SemesterListComponent } from './pages/academic-management/semester-list/semester-list';
import { SubjectListComponent } from './pages/subjects/subject-list/subject-list';
import { EnrollmentListComponent } from './pages/enrollments/enrollment-list/enrollment-list';
import { StudentSubjectsComponent } from './pages/student/student-subjects/student-subjects';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      // === Admin (lazy-loaded) ===
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
      },

      // === Teacher (lazy-loaded) ===
      {
        path: 'teacher',
        loadChildren: () => import('./features/teacher/teacher.routes').then(m => m.teacherRoutes),
      },

      // === Rutas legacy (retrocompatibilidad) ===
      { path: 'dashboard', component: Dashboard },
      { path: 'managements', component: ManagementListComponent },
      { path: 'semesters', component: SemesterListComponent },
      { path: 'subjects', component: SubjectListComponent },
      { path: 'users', component: Users },
      { path: 'enrollments', component: EnrollmentListComponent },

      // === Rutas Student ===
      {
        path: 'student',
        children: [
          { path: 'subjects', component: StudentSubjectsComponent },
        ]
      },
    ]
  },

  { path: 'login', component: Login },
  { path: '**', redirectTo: 'login' }
];
