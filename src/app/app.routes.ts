import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { Dashboard } from './features/dashboard/dashboard';
import { Layout } from './core/layout/layout';
import { Users } from './features/users/users';
import { ManagementListComponent } from './pages/academic-management/management-list/management-list';
import { SemesterListComponent } from './pages/academic-management/semester-list/semester-list';
import { SubjectListComponent } from './pages/subjects/subject-list/subject-list';
import { EnrollmentListComponent } from './pages/enrollments/enrollment-list/enrollment-list';
import { StudentSubjectsComponent } from './pages/student/student-subjects/student-subjects';
import { TeacherSubjectsComponent } from './pages/teacher/teacher-subjects/teacher-subjects';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'managements', component: ManagementListComponent, canActivate: [adminGuard] },
      { path: 'semesters', component: SemesterListComponent, canActivate: [adminGuard] },
      { path: 'subjects', component: SubjectListComponent, canActivate: [adminGuard] },
      { path: 'users', component: Users, canActivate: [adminGuard] },
      { path: 'enrollments', component: EnrollmentListComponent, canActivate: [adminGuard] },
    ]
  },

  { path: 'login', component: Login },

  { path: '**', redirectTo: 'login' }
];