import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Dashboard } from './features/dashboard/dashboard';
import { Layout } from './core/layout/layout';
import { Users } from './features/users/users';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'login' },

    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            { path: 'admin/dashboard', component: Dashboard },
            { path: 'teacher/dashboard', component: Dashboard },
            { path: 'student/dashboard', component: Dashboard },
            { path: 'admin/usuarios', component: Users }
        ]
    },

    { path: 'login', component: Login },

    { path: '**', redirectTo: 'login' }
];