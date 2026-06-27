import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Layout } from './layout';
import { AuthService } from '../services/auth.service';
import { authGuard } from '../guards/auth.guard';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { Component } from '@angular/core';

@Component({ template: '<h1>Login</h1>', standalone: true })
class TestLoginComponent {}

@Component({ template: '<h1>Admin Dash</h1>', standalone: true })
class TestAdminDashComponent {}

@Component({ template: '<h1>Student Dash</h1>', standalone: true })
class TestStudentDashComponent {}

describe('Navigation & Authentication Integration', () => {
  let fixture: ComponentFixture<Layout>;
  let component: Layout;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        provideRouter([
          { path: 'login', component: TestLoginComponent },
          {
            path: 'admin/dashboard',
            component: TestAdminDashComponent,
            canActivate: [authGuard],
            data: { role: 'ADMIN' }
          },
          {
            path: 'student/dashboard',
            component: TestStudentDashComponent,
            canActivate: [authGuard],
            data: { role: 'STUDENT' }
          }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('should render ADMIN menu options and handle logout flow', async () => {
    localStorage.setItem('role', 'ADMIN');
    localStorage.setItem('fullName', 'Administrador General');
    localStorage.setItem('token', 'mock-admin-token');

    fixture.detectChanges();

    // Mock API response for profile fetch
    const req = httpMock.expectOne(`${baseUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      message: '',
      data: {
        id: 'adm-123',
        fullName: 'Administrador General',
        role: 'ADMIN',
        email: 'admin@nur.edu'
      }
    });

    fixture.detectChanges();

    // Check menu items
    const menuLinks = fixture.nativeElement.querySelectorAll('.nav-link');
    const labels = Array.from(menuLinks).map((link: any) => link.textContent.trim());
    expect(labels).toContain('Catálogo de Materias');
    expect(labels).toContain('Matrículas');
    expect(labels).toContain('Reportes y Actas');
    expect(labels).not.toContain('Mis Materias'); // Teacher menu item

    // Simulate logout modal trigger
    component.openLogoutModal();
    fixture.detectChanges();
    expect(component.isLogoutModalOpen()).toBe(true);

    const routerSpy = vi.spyOn(router, 'navigate');
    component.confirmLogout();
    
    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(routerSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should render STUDENT menu options and enforce routing guard restrictions', async () => {
    localStorage.setItem('role', 'STUDENT');
    localStorage.setItem('fullName', 'Carlos Estudiante');
    localStorage.setItem('token', 'mock-student-token');

    fixture.detectChanges();

    const req = httpMock.expectOne(`${baseUrl}/auth/me`);
    req.flush({
      success: true,
      data: {
        id: 'stu-123',
        fullName: 'Carlos Estudiante',
        role: 'STUDENT',
        email: 'carlos@nur.edu'
      }
    });

    fixture.detectChanges();

    const menuLinks = fixture.nativeElement.querySelectorAll('.nav-link');
    const labels = Array.from(menuLinks).map((link: any) => link.textContent.trim());
    expect(labels).toContain('Asistencia');
    expect(labels).not.toContain('Matrículas'); // Admin only

    // Test Guard restriction: student attempting to access admin route redirects to student dashboard
    const routerSpy = vi.spyOn(router, 'navigate');
    
    // Simulate guard check for student accessing admin dashboard
    const routeSnapshotMock = { data: { role: 'ADMIN' } } as any;
    const stateSnapshotMock = { url: '/admin/dashboard' } as any;
    
    const canActivateResult = TestBed.runInInjectionContext(() => 
      authGuard(routeSnapshotMock, stateSnapshotMock)
    );
    
    expect(canActivateResult).toBe(false);
    expect(routerSpy).toHaveBeenCalledWith(['/student/dashboard']);
  });

  it('should redirect unauthenticated users to login page', () => {
    const routerSpy = vi.spyOn(router, 'navigate');
    
    const routeSnapshotMock = { data: { role: 'ADMIN' } } as any;
    const stateSnapshotMock = { url: '/admin/dashboard' } as any;

    const canActivateResult = TestBed.runInInjectionContext(() =>
      authGuard(routeSnapshotMock, stateSnapshotMock)
    );

    expect(canActivateResult).toBe(false);
    expect(routerSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/admin/dashboard' } });
  });
});
