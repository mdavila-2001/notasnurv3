import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage: string;

      switch (error.status) {
        case 401:
          if (!req.url.includes('/auth/login')) {
            errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
            authService.logout();
            router.navigate(['/login']);
          } else {
            errorMessage = error.error?.message || 'Credenciales inválidas.';
          }
          break;
        case 403:
          errorMessage = 'No tiene permisos suficientes para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no fue encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intente más tarde.';
          break;
        default:
          errorMessage = 'Ocurrió un error inesperado en el servidor.';
          break;
      }

      if (error.status !== 401 && error.error?.message) {
        errorMessage = error.error.message;
      }

      console.error(`[API Error] ${error.status}: ${errorMessage}`);

      toastService.error(errorMessage);

      return throwError(() => ({ status: error.status, message: errorMessage, details: error.error }));
    })
  );
};

