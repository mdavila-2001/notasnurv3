import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { Users } from '../users/users';
import { SubjectListComponent } from '../../pages/subjects/subject-list/subject-list';
import { ManagementListComponent } from '../../pages/academic-management/management-list/management-list';
import { SemesterListComponent } from '../../pages/academic-management/semester-list/semester-list';
import { EnrollmentListComponent } from '../../pages/enrollments/enrollment-list/enrollment-list';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/admin-dashboard').then(m => m.AdminDashboard),
      },
      { path: 'users', component: Users },
      { path: 'subjects', component: SubjectListComponent },
      { path: 'managements', component: ManagementListComponent },
      { path: 'semesters', component: SemesterListComponent },
      { path: 'enrollments', component: EnrollmentListComponent },
      {
        path: 'faculties',
        loadComponent: () => import('../../pages/academic-catalog/faculty-list/faculty-list').then(m => m.FacultyListComponent)
      },
      {
        path: 'degrees',
        loadComponent: () => import('../../pages/academic-catalog/degree-list/degree-list').then(m => m.DegreeListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/admin-reports/admin-reports').then(m => m.AdminReports)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/audit-logs/audit-logs').then(m => m.AuditLogs)
      },
    ],
  },
];
