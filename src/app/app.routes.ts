import { Routes } from '@angular/router';
import { TestPage } from './test-page/test-page';
import { Login } from './features/auth/login/login';
import { authGuard, guestGuard } from './core/guards/auth.guard';

import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: Login, canActivate: [guestGuard] },
	{ path: 'test', component: TestPage, canActivate: [guestGuard] },
	{ path: 'admin/dashboard', component: Dashboard, canActivate: [authGuard] },
	{ path: 'teacher/dashboard', component: Dashboard, canActivate: [authGuard] },
	{ path: 'student/dashboard', component: Dashboard, canActivate: [authGuard] },
	{ path: '**', redirectTo: 'login' }
];
