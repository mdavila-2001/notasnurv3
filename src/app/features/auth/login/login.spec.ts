import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      getCurrentUserProfile: vi.fn(),
      login: vi.fn(),
      logout: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not redirect or load profile if not authenticated on init', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);
    fixture.detectChanges();

    expect(mockAuthService.getCurrentUserProfile).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to admin dashboard if authenticated with ADMIN role on init', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUserProfile.mockReturnValue(of({
      success: true,
      data: { role: 'ADMIN', fullName: 'Admin User' }
    }));

    fixture.detectChanges();

    expect(mockAuthService.getCurrentUserProfile).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(component.isLoading()).toBe(false);
  });

  it('should redirect to teacher dashboard if authenticated with TEACHER role on init', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUserProfile.mockReturnValue(of({
      success: true,
      data: { role: 'TEACHER', fullName: 'Teacher User' }
    }));

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/teacher/dashboard']);
  });

  it('should redirect to student dashboard if authenticated with STUDENT role on init', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUserProfile.mockReturnValue(of({
      success: true,
      data: { role: 'STUDENT', fullName: 'Student User' }
    }));

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/student/dashboard']);
  });

  it('should redirect to /login if role is unrecognized on init', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUserProfile.mockReturnValue(of({
      success: true,
      data: { role: 'UNKNOWN', fullName: 'User' }
    }));

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should logout and set isLoading to false if profile fetch fails on init', () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUserProfile.mockReturnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('should display error message and not call login if form is invalid', () => {
    fixture.detectChanges();
    component.onSubmit();

    expect(component.errorMessage()).toBe('Please complete all required fields.');
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should submit login credentials, authenticate, and redirect user on success', () => {
    fixture.detectChanges();
    component.loginForm.patchValue({
      identifier: '12345',
      password: 'password123'
    });

    mockAuthService.login.mockReturnValue(of({
      success: true,
      data: { role: 'TEACHER', token: 'token-abc' }
    }));

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      id: '12345',
      password: 'password123'
    });
    expect(component.isLoading()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/teacher/dashboard']);
  });

  it('should handle login error and display translation message', () => {
    fixture.detectChanges();
    component.loginForm.patchValue({
      identifier: '12345',
      password: 'password123'
    });

    mockAuthService.login.mockReturnValue(throwError(() => ({
      message: 'Invalid credentials'
    })));

    component.onSubmit();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Invalid credentials');
  });

  it('should use default error message if error has no message field', () => {
    fixture.detectChanges();
    component.loginForm.patchValue({
      identifier: '12345',
      password: 'password123'
    });

    mockAuthService.login.mockReturnValue(throwError(() => ({})));

    component.onSubmit();

    expect(component.errorMessage()).toBe('An unexpected error occurred');
  });

  it('should expose idControl and passwordControl getters', () => {
    fixture.detectChanges();
    expect(component.idControl).toBeTruthy();
    expect(component.passwordControl).toBeTruthy();
  });
});
