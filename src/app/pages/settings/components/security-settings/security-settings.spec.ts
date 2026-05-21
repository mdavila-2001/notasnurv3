import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecuritySettings } from './security-settings';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of } from 'rxjs';
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
});
