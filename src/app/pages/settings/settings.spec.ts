import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockAuthService: any;
  let mockToastService: any;

  const mockProfile = {
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

  beforeEach(async () => {
    mockAuthService = {
      getCurrentUserProfile: vi.fn().mockReturnValue(of(mockProfile))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user profile on init', () => {
    expect(mockAuthService.getCurrentUserProfile).toHaveBeenCalled();
    expect(component.profile()).toEqual(mockProfile.data);
  });

  it('should change active tab correctly', () => {
    expect(component.activeTab()).toBe('profile');
    component.setTab('preferences');
    expect(component.activeTab()).toBe('preferences');
    component.setTab('security');
    expect(component.activeTab()).toBe('security');
  });

  it('should toggle dark mode state and show toast', () => {
    const initialDarkMode = component.isDarkMode();
    component.toggleDarkMode();
    expect(component.isDarkMode()).toBe(!initialDarkMode);
    expect(mockToastService.success).toHaveBeenCalled();
  });
});
