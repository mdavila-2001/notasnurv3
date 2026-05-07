import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Dashboard } from './features/dashboard/dashboard';
import { Layout } from './core/layout/layout';
import { Users } from './features/users/users';
import { ManagementListComponent } from './pages/academic-management/management-list/management-list';
import { SemesterListComponent } from './pages/academic-management/semester-list/semester-list';
import { SubjectListComponent } from './pages/subjects/subject-list/subject-list';
import { EnrollmentListComponent } from './pages/enrollments/enrollment-list/enrollment-list';
import { StudentSubjectsComponent } from './pages/student/student-subjects/student-subjects';
import { TeacherSubjectsComponent } from './pages/teacher/teacher-subjects/teacher-subjects';
import { TeacherDashboard } from './features/dashboard/teacher-dashboard/teacher-dashboard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'managements', component: ManagementListComponent },
      { path: 'semesters', component: SemesterListComponent },
      { path: 'subjects', component: SubjectListComponent },
      { path: 'users', component: Users },
      { path: 'enrollments', component: EnrollmentListComponent },
      
      // Rutas específicas por rol (como se define en el sidebar)
      { 
        path: 'teacher',
        children: [
          { path: 'dashboard', component: TeacherDashboard },
          { path: 'subjects', component: TeacherSubjectsComponent },
          {
            path: 'subject/:id',
            children: [
              // { path: 'students', component: StudentsListComponent },
              // { path: 'evaluation-plan', component: EvaluationPlanComponent }
            ]
          }
        ]
      }
    ]
  },

  { path: 'login', component: Login },

  { path: '**', redirectTo: 'login' }
];