import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceSettings } from './attendance-settings';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { GlobalSettingsResponse } from '../../../../core/models/settings.model';

describe('AttendanceSettings', () => {
  let component: AttendanceSettings;
  let fixture: ComponentFixture<AttendanceSettings>;
  let mockSettingsService: any;
  let mockToastService: any;

  const mockSettings: GlobalSettingsResponse = {
    academic: {
      minPassingGrade: 51,
      roundingType: 'CLASSIC_UP',
      globalGradesDeadline: '2026-06-30'
    },
    attendance: {
      maxAbsencesPresencial: 5,
      maxAbsencesSemiPresencial: 3
    },
    institutional: {
      pdfTemplateHeaderType: 'NUR_CLASSIC',
      allowLateGradesEntry: false
    }
  };

  beforeEach(async () => {
    mockSettingsService = {
      getGlobalSettings: vi.fn().mockReturnValue(of(mockSettings)),
      saveGlobalSettings: vi.fn().mockReturnValue(of(mockSettings))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AttendanceSettings, ReactiveFormsModule],
      providers: [
        { provide: GlobalSettingsService, useValue: mockSettingsService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load global settings on init and patch form', () => {
    expect(mockSettingsService.getGlobalSettings).toHaveBeenCalled();
    expect(component.currentSettings()).toEqual(mockSettings);
    expect(component.maxAbsencesPresencialControl?.value).toBe(5);
    expect(component.maxAbsencesSemiPresencialControl?.value).toBe(3);
  });

  it('should validate minimum absences limits', () => {
    component.maxAbsencesPresencialControl?.setValue(-2);
    expect(component.maxAbsencesPresencialControl?.valid).toBe(false);

    component.maxAbsencesPresencialControl?.setValue(10);
    expect(component.maxAbsencesPresencialControl?.valid).toBe(true);
  });

  it('should save updated attendance settings on submit', () => {
    component.maxAbsencesPresencialControl?.setValue(6);
    component.maxAbsencesSemiPresencialControl?.setValue(4);
    component.onSubmit();

    expect(mockSettingsService.saveGlobalSettings).toHaveBeenCalledWith({
      ...mockSettings,
      attendance: {
        maxAbsencesPresencial: 6,
        maxAbsencesSemiPresencial: 4
      }
    });
    expect(mockToastService.success).toHaveBeenCalledWith('Configuración de asistencia guardada exitosamente.');
  });

  it('should show toast error and stop loading when getGlobalSettings fails', () => {
    mockSettingsService.getGlobalSettings.mockReturnValue(throwError(() => new Error('Load failed')));
    component.ngOnInit();

    expect(mockToastService.error).toHaveBeenCalledWith('Error al cargar la configuración de asistencia.');
    expect(component.isLoading()).toBe(false);
  });

  it('should mark form as touched and not submit if form is invalid', () => {
    component.maxAbsencesPresencialControl?.setValue(-5); // invalid
    const markAllAsTouchedSpy = vi.spyOn(component.attendanceForm, 'markAllAsTouched');
    
    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(mockSettingsService.saveGlobalSettings).not.toHaveBeenCalled();
  });

  it('should show toast error on submit when saveGlobalSettings fails', () => {
    mockSettingsService.saveGlobalSettings.mockReturnValue(throwError(() => ({ message: 'Save error' })));
    component.maxAbsencesPresencialControl?.setValue(6);
    component.onSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('Save error');
    expect(component.isSaving()).toBe(false);
  });

  it('should show default toast error on submit when saveGlobalSettings fails with no message', () => {
    mockSettingsService.saveGlobalSettings.mockReturnValue(throwError(() => new Error()));
    component.maxAbsencesPresencialControl?.setValue(6);
    component.onSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('Error al guardar la configuración de asistencia.');
    expect(component.isSaving()).toBe(false);
  });
});
