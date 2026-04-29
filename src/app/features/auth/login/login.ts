import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth/auth';
import { Input } from '../../../shared/components/input/input';
import { Button } from '../../../shared/components/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  loginForm = this.fb.group({
    id: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoading.set(true);
      this.authService.getMe().subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('fullName', response.data.fullName);
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          this.isLoading.set(false);
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('role');
          localStorage.removeItem('fullName');
        }
      });
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, complete todos los campos.');
      return;
    }

    const id = this.loginForm.value.id?.trim() ?? '';
    const password = this.loginForm.value.password?.trim() ?? '';

    if (!id || !password) {
      this.errorMessage.set('El identificador y la contraseña son obligatorios.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Evita arrastrar sesión anterior mientras se intenta una nueva autenticación.
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');

    const credentials = {
      id,
      password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 400) {
          this.errorMessage.set(
            err.error?.message ||
            'Credenciales inválidas. Si eres estudiante usa CI; si eres docente/administrativo usa correo institucional.'
          );
          return;
        }

        if (err.status === 500) {
          this.errorMessage.set('Error interno del servidor. Revisa el backend y su conexión a base de datos.');
          return;
        }

        this.errorMessage.set(err.error?.message || 'Error al conectar con el servidor.');
      }
    });
  }

  get idControl() { return this.loginForm.get('id'); }
  get passwordControl() { return this.loginForm.get('password'); }

  onIdChange(value: string | number) {
    this.idControl?.setValue(String(value));
  }

  onPasswordChange(value: string | number) {
    this.passwordControl?.setValue(String(value));
  }
}
