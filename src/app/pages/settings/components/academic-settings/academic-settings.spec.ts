import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicSettings } from './academic-settings';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { GlobalSettingsResponse } from '../../../../core/models/settings.model';

describe('AcademicSettings', () => {
  let component: AcademicSettings;
  let fixture: ComponentFixture<AcademicSettings>;
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
      imports: [AcademicSettings, ReactiveFormsModule],
      providers: [
        { provide: GlobalSettingsService, useValue: mockSettingsService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AcademicSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load global settings on init and patch form', () => {
    expect(mockSettingsService.getGlobalSettings).toHaveBeenCalled();
    expect(component.currentSettings()).toEqual(mockSettings);
    expect(component.minPassingGradeControl?.value).toBe(51);
    expect(component.roundingTypeControl?.value).toBe('CLASSIC_UP');
  });

  it('should validate range for passing grade', () => {
    component.minPassingGradeControl?.setValue(-5);
    expect(component.minPassingGradeControl?.valid).toBe(false);

    component.minPassingGradeControl?.setValue(105);
    expect(component.minPassingGradeControl?.valid).toBe(false);

    component.minPassingGradeControl?.setValue(60);
    expect(component.minPassingGradeControl?.valid).toBe(true);
  });

  it('should save updated academic settings on submit', () => {
    component.minPassingGradeControl?.setValue(61);
    component.roundingTypeControl?.setValue('TRUNCATE');
    component.onSubmit();

    expect(mockSettingsService.saveGlobalSettings).toHaveBeenCalledWith({
      ...mockSettings,
      academic: {
        minPassingGrade: 61,
        roundingType: 'TRUNCATE',
        globalGradesDeadline: '2026-06-30'
      }
    });
    expect(mockToastService.success).toHaveBeenCalledWith('Configuración académica guardada exitosamente.');
  });

  it('should parse ISO date strings with T separator correctly on load', () => {
    const settingsWithIsoDate: GlobalSettingsResponse = {
      ...mockSettings,
      academic: {
        ...mockSettings.academic,
        globalGradesDeadline: '2026-07-15T00:00:00'
      }
    };
    mockSettingsService.getGlobalSettings.mockReturnValue(of(settingsWithIsoDate));
    
    // Trigger loadSettings again by calling ngOnInit
    component.ngOnInit();
    expect(component.globalGradesDeadlineControl?.value).toBe('2026-07-15');
  });

  it('should show toast error and stop loading when getGlobalSettings fails', () => {
    mockSettingsService.getGlobalSettings.mockReturnValue(throwError(() => new Error('Load failed')));
    component.ngOnInit();

    expect(mockToastService.error).toHaveBeenCalledWith('Error al cargar la configuración académica.');
    expect(component.isLoading()).toBe(false);
  });

  it('should mark form as touched and not submit if form is invalid', () => {
    component.minPassingGradeControl?.setValue(-10); // invalid
    const markAllAsTouchedSpy = vi.spyOn(component.academicForm, 'markAllAsTouched');
    
    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(mockSettingsService.saveGlobalSettings).not.toHaveBeenCalled();
  });

  it('should show toast error on submit when saveGlobalSettings fails', () => {
    mockSettingsService.saveGlobalSettings.mockReturnValue(throwError(() => ({ message: 'Save error' })));
    component.minPassingGradeControl?.setValue(61);
    component.onSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('Save error');
    expect(component.isSaving()).toBe(false);
  });

  it('should show default toast error on submit when saveGlobalSettings fails with no message', () => {
    mockSettingsService.saveGlobalSettings.mockReturnValue(throwError(() => new Error()));
    component.minPassingGradeControl?.setValue(61);
    component.onSubmit();

    expect(mockToastService.error).toHaveBeenCalledWith('Error al guardar la configuración académica.');
    expect(component.isSaving()).toBe(false);
  });
});
