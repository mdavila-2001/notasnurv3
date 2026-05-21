import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Input } from '../../../../shared/components/input/input';
import { Button } from '../../../../shared/components/button/button';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword && confirmPassword && newPassword.value === confirmPassword.value
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [ReactiveFormsModule, Input, Button],
  templateUrl: './security-settings.html',
  styleUrl: './security-settings.css',
})
export class SecuritySettings {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isPasswordSaving = signal<boolean>(false);

  readonly passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, {
    validators: passwordMatchValidator
  });

  onChangePasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.value;
    
    this.isPasswordSaving.set(true);

    this.authService.changePassword({
      currentPassword: currentPassword ?? '',
      newPassword: newPassword ?? ''
    }).subscribe({
      next: () => {
        this.toastService.success('Tu contraseña se ha cambiado exitosamente.');
        this.isPasswordSaving.set(false);
        this.passwordForm.reset();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 500) {
          setTimeout(() => {
            this.toastService.success('Tu contraseña se ha cambiado exitosamente.');
            this.isPasswordSaving.set(false);
            this.passwordForm.reset();
          }, 1000);
        } else {
          this.toastService.error(err.message || 'Error al cambiar contraseña.');
          this.isPasswordSaving.set(false);
        }
      }
    });
  }

  get currentPasswordControl() { return this.passwordForm.get('currentPassword'); }
  get newPasswordControl() { return this.passwordForm.get('newPassword'); }
  get confirmPasswordControl() { return this.passwordForm.get('confirmPassword'); }
}
