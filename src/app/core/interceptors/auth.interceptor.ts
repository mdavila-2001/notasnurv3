import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_STORAGE_KEYS = ['token', 'access_token'] as const;
const AUTH_API_BASE_URL = `${environment.apiBaseUrl.replace(/\/$/, '')}/auth`;

function resolveToken() {
  for (const key of TOKEN_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function isAuthEndpoint(request: HttpRequest<unknown>) {
  return (
    request.url.startsWith(`${AUTH_API_BASE_URL}/login`) ||
    request.url.startsWith(`${AUTH_API_BASE_URL}/logout`)
  );
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);

  const token = resolveToken();
  const shouldAttachToken = Boolean(token) && !isAuthEndpoint(request);

  let requestToSend = request;

  if (shouldAttachToken && token) {
    requestToSend = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!environment.production) {
    console.log('[AuthInterceptor] URL:', request.url);
    console.log('[AuthInterceptor] Token encontrado:', Boolean(token));
    console.log('[AuthInterceptor] Authorization agregado:', shouldAttachToken);
  }

  return next(requestToSend).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (!environment.production) {
          console.warn('[AuthInterceptor] 401 detectado. Redirigiendo a login.');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        localStorage.removeItem('fullName');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
