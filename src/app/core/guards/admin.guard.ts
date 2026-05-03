import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  const token = auth.getToken();
  const role = auth.getRole();

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  // Este guard solo protege la navegación de la UI; la autorización real debe validarla el backend.
  if (role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
