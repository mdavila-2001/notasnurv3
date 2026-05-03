import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  if (role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
