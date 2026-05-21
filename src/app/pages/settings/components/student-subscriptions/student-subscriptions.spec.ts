import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentSubscriptions } from './student-subscriptions';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('StudentSubscriptions', () => {
  let component: StudentSubscriptions;
  let fixture: ComponentFixture<StudentSubscriptions>;
  let mockSettingsService: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockSettingsService = {
      getStudentSubscriptions: vi.fn().mockReturnValue(of({ emailAlertOnRisk: true })),
      saveStudentSubscriptions: vi.fn().mockReturnValue(of({ emailAlertOnRisk: false }))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [StudentSubscriptions],
      providers: [
        { provide: GlobalSettingsService, useValue: mockSettingsService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSubscriptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load student subscriptions status on init', () => {
    expect(mockSettingsService.getStudentSubscriptions).toHaveBeenCalled();
    expect(component.emailAlertOnRisk()).toBe(true);
  });

  it('should toggle and save subscription status on click', () => {
    component.toggleEmailAlerts();
    expect(mockSettingsService.saveStudentSubscriptions).toHaveBeenCalledWith({ emailAlertOnRisk: false });
    expect(component.emailAlertOnRisk()).toBe(false);
    expect(mockToastService.success).toHaveBeenCalledWith('Alertas de inasistencia deshabilitadas.');
  });
});
