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

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'login' },

    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            // Admin
            { path: 'admin/dashboard', component: Dashboard },
            { path: 'admin/managements', component: ManagementListComponent },
            { path: 'admin/semesters', component: SemesterListComponent },
            { path: 'admin/subjects', component: SubjectListComponent },
            { path: 'admin/users', component: Users },
            { path: 'admin/enrollments', component: EnrollmentListComponent },

            // Docente
            { path: 'teacher/dashboard', component: Dashboard },
            { path: 'teacher/subjects', component: TeacherSubjectsComponent },

            // Estudiante
            { path: 'student/dashboard', component: Dashboard },
            { path: 'student/subjects', component: StudentSubjectsComponent },
        ]
    },

    { path: 'login', component: Login },

    { path: '**', redirectTo: 'login' }
];