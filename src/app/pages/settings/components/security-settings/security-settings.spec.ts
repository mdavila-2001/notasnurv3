import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecuritySettings } from './security-settings';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('SecuritySettings', () => {
  let component: SecuritySettings;
  let fixture: ComponentFixture<SecuritySettings>;
  let mockAuthService: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockAuthService = {
      changePassword: vi.fn().mockReturnValue(of({ success: true, message: 'Password updated' }))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SecuritySettings, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SecuritySettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate matching passwords', () => {
    component.passwordForm.setValue({
      currentPassword: 'password123',
      newPassword: 'newPassword123',
      confirmPassword: 'differentPassword'
    });
    expect(component.passwordForm.valid).toBe(false);
    expect(component.passwordForm.errors?.['passwordMismatch']).toBe(true);

    component.passwordForm.setValue({
      currentPassword: 'password123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    });
    expect(component.passwordForm.valid).toBe(true);
  });

  it('should call authService.changePassword on submit', () => {
    component.passwordForm.setValue({
      currentPassword: 'password123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    });
    
    component.onChangePasswordSubmit();
    
    expect(mockAuthService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'password123',
      newPassword: 'newPassword123'
    });
    expect(mockToastService.success).toHaveBeenCalledWith('Tu contraseña se ha cambiado exitosamente.');
  });

  it('should mark all controls as touched if form is invalid on submit', () => {
    component.passwordForm.setValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    expect(component.passwordForm.invalid).toBe(true);

    const markAllAsTouchedSpy = vi.spyOn(component.passwordForm, 'markAllAsTouched');
    component.onChangePasswordSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(mockAuthService.changePassword).not.toHaveBeenCalled();
  });

  it('should handle 404 error response on submit', () => {
    mockAuthService.changePassword.mockReturnValue(throwError(() => ({ status: 404 })));
    component.passwordForm.setValue({
      currentPassword: 'password123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    });

    component.onChangePasswordSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('No se pudo procesar el cambio de contraseña.');
    expect(component.isPasswordSaving()).toBe(false);
  });

  it('should handle 500 error response on submit', () => {
    mockAuthService.changePassword.mockReturnValue(throwError(() => ({ status: 500 })));
    component.passwordForm.setValue({
      currentPassword: 'password123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    });

    component.onChangePasswordSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('Ocurrió un error del servidor al cambiar la contraseña.');
    expect(component.isPasswordSaving()).toBe(false);
  });

  it('should handle general error response on submit', () => {
    mockAuthService.changePassword.mockReturnValue(throwError(() => ({ message: 'General change error' })));
    component.passwordForm.setValue({
      currentPassword: 'password123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    });

    component.onChangePasswordSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('General change error');
    expect(component.isPasswordSaving()).toBe(false);
  });
});
