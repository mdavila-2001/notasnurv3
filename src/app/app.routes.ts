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
      // === Admin (lazy-loaded, role-protected) ===
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
      },

      // === Teacher (lazy-loaded, role-protected) ===
      {
        path: 'teacher',
        loadChildren: () => import('./features/teacher/teacher.routes').then(m => m.teacherRoutes),
      },

      // === Student ===
      {
        path: 'student',
        children: [
          { path: 'subjects', component: StudentSubjectsComponent },
        ]
      },

      // Redirect legacy /dashboard → role-appropriate dashboard
      // El authGuard en la ruta padre ya verificó autenticación;
      // la redirección se maneja en el login por rol.
      { path: 'dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },
    ]
  },

  { path: 'login', component: Login },
  { path: '**', redirectTo: 'login' }
];

