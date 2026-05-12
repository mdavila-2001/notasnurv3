import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // UI State using Signals for optimal performance
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  readonly loginForm = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    this.checkExistingSession();
  }

  private checkExistingSession(): void {
    if (this.authService.isAuthenticated()) {
      this.isLoading.set(true);
      this.authService.getCurrentUserProfile().subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.redirectByRole(response.data.role);
        },
        error: () => {
          this.isLoading.set(false);
          this.authService.logout();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Please complete all required fields.');
      return;
    }

    const { identifier, password } = this.loginForm.value;
    
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Mapeo de formulario a DTO: 'identifier' (UI) -> 'id' (Backend Contract)
    const loginDto = { id: identifier ?? '', password: password ?? '' };
    
    this.authService.login(loginDto).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const role = response.data?.role;
        this.redirectByRole(role);
      },
      error: (err) => {
        this.isLoading.set(false);
        // The ErrorInterceptor handles the message translation, 
        // we just extract it from the thrown error
        this.errorMessage.set(err.message || 'An unexpected error occurred');
      }
    });
  }

  private redirectByRole(role: string | undefined): void {
    if (role === 'TEACHER') {
      this.router.navigate(['/teacher/dashboard']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Getters for clean template access
  get idControl() { return this.loginForm.get('identifier'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
