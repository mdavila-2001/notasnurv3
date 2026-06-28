import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Layout } from './layout';
import { AuthService } from '../services/auth.service';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;
  let mockAuthService: any;
  let router: Router;

  const mockAdminProfile = {
    success: true,
    data: {
      fullName: 'Admin User',
      role: 'ADMIN'
    }
  };

  const mockTeacherProfile = {
    success: true,
    data: {
      fullName: 'Teacher User',
      role: 'TEACHER'
    }
  };

  const mockStudentProfile = {
    success: true,
    data: {
      fullName: 'Student User',
      role: 'STUDENT'
    }
  };

  beforeEach(() => {
    mockAuthService = {
      getUserRole: vi.fn().mockReturnValue('ADMIN'),
      getUserFullName: vi.fn().mockReturnValue('Admin User'),
      getCurrentUserProfile: vi.fn().mockReturnValue(of(mockAdminProfile)),
      logout: vi.fn()
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [Layout, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  }

  it('should create', async () => {
    await createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should build ADMIN menu initially', async () => {
    await createComponent();
    fixture.detectChanges();

    expect(component.userRole()).toBe('ADMIN');
    expect(component.userName()).toBe('Admin User');
    expect(component.userRoleDisplay()).toBe('Administrador');
    expect(component.roleDisplayName()).toBe('Portal Administrador');

    const menu = component.menuItems();
    expect(menu.length).toBe(10);
    expect(menu.find(m => m.path === '/admin/users')).toBeTruthy();
  });

  it('should load profile and switch to TEACHER menu if role is TEACHER', async () => {
    mockAuthService.getUserRole.mockReturnValue('TEACHER');
    mockAuthService.getUserFullName.mockReturnValue('Teacher User');
    mockAuthService.getCurrentUserProfile.mockReturnValue(of(mockTeacherProfile));

    await createComponent();
    fixture.detectChanges();

    expect(component.userRole()).toBe('TEACHER');
    expect(component.userName()).toBe('Teacher User');
    expect(component.userRoleDisplay()).toBe('Docente');
    expect(component.roleDisplayName()).toBe('Portal Docente');

    const menu = component.menuItems();
    expect(menu.length).toBe(5);
    expect(menu.find(m => m.path === '/teacher/subjects')).toBeTruthy();
  });

  it('should load profile and switch to STUDENT menu if role is STUDENT', async () => {
    mockAuthService.getUserRole.mockReturnValue('STUDENT');
    mockAuthService.getUserFullName.mockReturnValue('Student User');
    mockAuthService.getCurrentUserProfile.mockReturnValue(of(mockStudentProfile));

    await createComponent();
    fixture.detectChanges();

    expect(component.userRole()).toBe('STUDENT');
    expect(component.userName()).toBe('Student User');
    expect(component.userRoleDisplay()).toBe('Estudiante');
    expect(component.roleDisplayName()).toBe('Portal Estudiante');

    const menu = component.menuItems();
    expect(menu.length).toBe(4);
    expect(menu.find(m => m.path === '/student/attendance')).toBeTruthy();
  });

  it('should handle profile API errors and log to console', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAuthService.getCurrentUserProfile.mockReturnValue(throwError(() => new Error('API Fail')));

    await createComponent();
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalled();
    expect(component.userName()).toBe('Admin User'); // kept cached name
    consoleSpy.mockRestore();
  });

  it('should fallback to default display if role is unknown', async () => {
    mockAuthService.getUserRole.mockReturnValue('UNKNOWN_ROLE');
    mockAuthService.getCurrentUserProfile.mockReturnValue(of({
      success: true,
      data: { fullName: 'External User', role: 'UNKNOWN_ROLE' }
    }));

    await createComponent();
    fixture.detectChanges();

    expect(component.userRoleDisplay()).toBe('Universitario');
    expect(component.roleDisplayName()).toBe('Portal Universitario');
  });

  it('should toggle and close sidebar', async () => {
    await createComponent();
    fixture.detectChanges();

    expect(component.isSidebarOpen()).toBe(false);
    component.toggleSidebar();
    expect(component.isSidebarOpen()).toBe(true);

    component.closeSidebar();
    expect(component.isSidebarOpen()).toBe(false);
  });

  it('should open and close logout modal', async () => {
    await createComponent();
    fixture.detectChanges();

    expect(component.isLogoutModalOpen()).toBe(false);
    component.openLogoutModal();
    expect(component.isLogoutModalOpen()).toBe(true);

    component.closeLogoutModal();
    expect(component.isLogoutModalOpen()).toBe(false);
  });

  it('should call auth logout and navigate on logout confirm', async () => {
    await createComponent();
    fixture.detectChanges();

    component.confirmLogout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
