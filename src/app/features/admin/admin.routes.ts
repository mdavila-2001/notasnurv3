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
    ],
  },
];
