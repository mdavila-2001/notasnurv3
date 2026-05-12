import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error inesperado en el servidor';

      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }

      switch (error.status) {
        case 401:
          errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
          localStorage.removeItem('auth_token');
          router.navigate(['/login']);
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
      }

      console.error(`[API Error] ${error.status}: ${errorMessage}`);
      
      // Aquí se podría integrar un servicio de notificaciones/toasts
      alert(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
