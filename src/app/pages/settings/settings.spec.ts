if (typeof localStorage === 'undefined') {
  const mockStorage = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, value: string) => mockStorage.set(key, String(value)),
    removeItem: (key: string) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
    key: (index: number) => Array.from(mockStorage.keys())[index] ?? null,
    get length() { return mockStorage.size; }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
  });
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockAuthService: any;
  let mockToastService: any;

  const mockProfileTeacher = {
    success: true,
    message: '',
    data: {
      id: 'usr-123',
      ci: '654321',
      fullName: 'Alejandro Prado',
      email: 'a.prado@nur.edu',
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  };

  const mockProfileAdmin = {
    success: true,
    message: '',
    data: {
      id: 'usr-admin',
      ci: '111111',
      fullName: 'Admin User',
      email: 'admin@nur.edu',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  };

  const mockProfileStudent = {
    success: true,
    message: '',
    data: {
      id: 'usr-student',
      ci: '222222',
      fullName: 'Student User',
      email: 'student@nur.edu',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  };

  beforeEach(() => {
    mockAuthService = {
      getCurrentUserProfile: vi.fn().mockReturnValue(of(mockProfileTeacher))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    document.documentElement.classList.remove('dark-theme');
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.classList.remove('dark-theme');
    localStorage.clear();
  });

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
  }

  it('should create', async () => {
    await createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load user profile on init', async () => {
    await createComponent();
    fixture.detectChanges();
    expect(mockAuthService.getCurrentUserProfile).toHaveBeenCalled();
    expect(component.profile()).toEqual(mockProfileTeacher.data);
  });

  it('should handle profile load error gracefully', async () => {
    mockAuthService.getCurrentUserProfile.mockReturnValue(throwError(() => new Error('Error')));
    await createComponent();
    fixture.detectChanges();
    expect(component.isProfileLoading()).toBe(false);
    expect(mockToastService.error).toHaveBeenCalledWith('No se pudo cargar la información del perfil.');
  });

  it('should change active tab correctly', async () => {
    await createComponent();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('profile');
    component.setTab('preferences');
    expect(component.activeTab()).toBe('preferences');
    component.setTab('security');
    expect(component.activeTab()).toBe('security');
  });

  it('should load tabs for TEACHER role (only base tabs)', async () => {
    await createComponent();
    fixture.detectChanges();
    const tabs = component.tabs();
    expect(tabs.length).toBe(2);
    expect(tabs.map(t => t.id)).toEqual(['profile', 'preferences']);
  });

  it('should load extra tabs for ADMIN role', async () => {
    mockAuthService.getCurrentUserProfile.mockReturnValue(of(mockProfileAdmin));
    await createComponent();
    fixture.detectChanges();
    const tabs = component.tabs();
    expect(tabs.length).toBe(5);
    expect(tabs.map(t => t.id)).toEqual(['profile', 'preferences', 'security', 'system-academic', 'system-attendance']);
  });

  it('should load extra tabs for STUDENT role', async () => {
    mockAuthService.getCurrentUserProfile.mockReturnValue(of(mockProfileStudent));
    await createComponent();
    fixture.detectChanges();
    const tabs = component.tabs();
    expect(tabs.length).toBe(2);
    expect(tabs.map(t => t.id)).toEqual(['profile', 'preferences']);
  });

  it('should initialize dark theme if document contains dark-theme class', async () => {
    document.documentElement.classList.add('dark-theme');
    await createComponent();
    fixture.detectChanges();
    expect(component.isDarkMode()).toBe(true);
  });

  it('should initialize dark theme if localStorage contains dark theme key', async () => {
    localStorage.setItem('theme', 'dark');
    await createComponent();
    fixture.detectChanges();
    expect(component.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('should toggle dark mode state, update document class/localStorage, and show success toast', async () => {
    await createComponent();
    fixture.detectChanges();
    expect(component.isDarkMode()).toBe(false);

    component.toggleDarkMode();
    expect(component.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(mockToastService.success).toHaveBeenCalledWith('Tema oscuro activado.');

    component.toggleDarkMode();
    expect(component.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(mockToastService.success).toHaveBeenCalledWith('Tema claro activado.');
  });

  it('should render corresponding components in template based on activeTab', async () => {
    mockAuthService.getCurrentUserProfile.mockReturnValue(of(mockProfileAdmin));
    await createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-profile-view')).toBeTruthy();

    component.setTab('security');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-security-settings')).toBeTruthy();

    component.setTab('system-academic');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-academic-settings')).toBeTruthy();

    component.setTab('system-attendance');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-attendance-settings')).toBeTruthy();
  });
});
