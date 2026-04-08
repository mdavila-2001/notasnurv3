import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Input } from '../../../shared/components/input/input';
import { Button } from '../../../shared/components/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
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

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, complete todos los campos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials = {
      id: this.loginForm.value.id!,
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Redirigir según el rol
        if (response.data.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (response.data.role === 'TEACHER') {
          this.router.navigate(['/teacher/dashboard']);
        } else {
          this.router.navigate(['/student/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        // Atrapamos el error que lanza el GlobalExceptionHandler de tu Spring Boot
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
