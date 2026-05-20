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
        // 👇 ESTA ES LA MAGIA QUE FALTABA 👇
        children: [
          // Si entra a subject/2 nomás, lo redirigimos automático a la pestaña students
          { path: '', redirectTo: 'students', pathMatch: 'full' }, 
          {
            path: 'students',
            // Asegúrate de que esta ruta llegue correctamente a donde creamos tu componente
          loadComponent: () => import('./pages/subject-detail/tabs/students-tab/students-tab').then(m => m.StudentsTab)
          }
        ]
      },
    ],
  },
];
