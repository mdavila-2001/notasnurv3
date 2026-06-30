import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Location } from '@angular/common';

import { GradeGridComponent } from './grade-grid.component';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { AttendanceService } from '../../../../features/teacher/services/attendance.service';
import { GradeApiService } from '../../services/grade-api.service';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CURRENT_DATE } from '../../../../core/services/settings/current-date.token';
import { GlobalSettingsResponse } from '../../../../core/models/settings.model';
import { StudentOperational } from '../../../../core/models/operational.model';
import { GradeResponse } from '../../../../core/models/grade.models';

describe('GradeGridComponent', () => {
  let component: GradeGridComponent;
  let fixture: ComponentFixture<GradeGridComponent>;
  let mockOperationalService: any;
  let mockAttendanceService: any;
  let mockGradeApi: any;
  let mockSettingsService: any;
  let mockToast: any;
  let mockCurrentDateFn: any;
  let mockLocation: any;

  const mockStudents: StudentOperational[] = [
    {
      studentId: '1',
      fullName: 'Carlos Gómez',
      ci: '123456',
      enrollmentId: 'enroll-1',
      degreeName: 'Ingeniería de Sistemas',
      photoUrl: '',
    },
    {
      studentId: '2',
      fullName: 'Ana Rojas',
      ci: '654321',
      enrollmentId: 'enroll-2',
      degreeName: 'Administración',
      photoUrl: '',
    }
  ];

  const mockEvaluationPlan = {
    id: 10,
    subjectId: 101,
    components: [
      { id: 1, name: 'Parcial 1', weight: 40, description: 'Examen 1' },
      { id: 2, name: 'Parcial 2', weight: 60, description: 'Examen 2' }
    ]
  };

  const mockSubject = {
    id: 101,
    code: 'SIS-101',
    name: 'Taller V',
    modality: 'FACE_TO_FACE' as const,
    recordStatus: 'PUBLISHED' as const,
  };

  const mockGrades: GradeResponse[] = [
    { id: 1, enrollmentId: 'enroll-1', componentId: 1, score: 35 },
    { id: 2, enrollmentId: 'enroll-1', componentId: 2, score: 50 },
    { id: 3, enrollmentId: 'enroll-2', componentId: 1, score: 20 },
  ];

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
    mockOperationalService = {
      students: signal(mockStudents),
      evaluationPlan: signal(mockEvaluationPlan),
      subject: signal(mockSubject),
      currentSubjectId: signal('101'),
      studentsLoading: signal(false),
      isLoading: signal(false),
      contextError: signal<string | null>(null),
      studentsError: signal<string | null>(null),
      loadSubjectContext: vi.fn(),
      clearContextError: vi.fn(),
      clearStudentsError: vi.fn(),
      clearStore: vi.fn(),
    };

    mockAttendanceService = {
      getSubjectAbsences: vi.fn().mockReturnValue(of(new Map([
        ['enroll-1', 4], // Presencial (limit 5): 4 absences
        ['enroll-2', 5]  // Presencial (limit 5): 5 absences
      ])))
    };

    mockGradeApi = {
      getGradesBySubject: vi.fn().mockReturnValue(of(mockGrades)),
      saveGrades: vi.fn().mockReturnValue(of({ success: true, message: 'Notas guardadas', data: null }))
    };

    mockSettingsService = {
      getGlobalSettings: vi.fn().mockReturnValue(of(mockSettings))
    };

    mockToast = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn()
    };

    mockLocation = {
      back: vi.fn()
    };

    mockCurrentDateFn = vi.fn().mockReturnValue(new Date(2026, 5, 15));

    await TestBed.configureTestingModule({
      imports: [GradeGridComponent, HttpClientTestingModule],
      providers: [
        { provide: SubjectOperationalService, useValue: mockOperationalService },
        { provide: GlobalSettingsService, useValue: mockSettingsService },
        { provide: ToastService, useValue: mockToast },
        { provide: CURRENT_DATE, useValue: mockCurrentDateFn },
        { provide: Location, useValue: mockLocation },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => '101'
            })
          }
        }
      ]
    })
    .overrideComponent(GradeGridComponent, {
      set: {
        providers: [
          { provide: AttendanceService, useValue: mockAttendanceService },
          { provide: GradeApiService, useValue: mockGradeApi }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradeGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load global settings and compute signals on init', () => {
    expect(mockSettingsService.getGlobalSettings).toHaveBeenCalled();
    expect(component.globalSettings()).toEqual(mockSettings);
  });

  describe('Req 6: Grades Closing and Date Lock Validation', () => {
    it('should NOT lock grades if current date is BEFORE deadline', () => {
      component.currentDate.set(new Date(2026, 5, 15));
      fixture.detectChanges();

      expect(component.isGradesLocked()).toBe(false);
      expect(component.canSave()).toBe(true);
    });

    it('should NOT lock grades if current date is ON the deadline day', () => {
      component.currentDate.set(new Date(2026, 5, 30));
      fixture.detectChanges();

      expect(component.isGradesLocked()).toBe(false);
      expect(component.canSave()).toBe(true);
    });

    it('should lock grades if current date is AFTER the deadline day and allowLateGradesEntry is false', () => {
      component.currentDate.set(new Date(2026, 6, 1));
      fixture.detectChanges();

      expect(component.isGradesLocked()).toBe(true);
      expect(component.canSave()).toBe(false);
    });

    it('should NOT lock grades even if date is AFTER deadline when allowLateGradesEntry is true', () => {
      component.currentDate.set(new Date(2026, 6, 1));
      component.globalSettings.set({
        ...mockSettings,
        institutional: {
          ...mockSettings.institutional,
          allowLateGradesEntry: true
        }
      });
      fixture.detectChanges();

      expect(component.isGradesLocked()).toBe(false);
      expect(component.canSave()).toBe(true);
    });
  });

  describe('Req 7: Academic Status computation based on absences and scores', () => {
    it('should evaluate student status correctly based on modality and absence limit (>= check)', () => {
      const data = component.tableData();
      const student1 = data.find(r => r.enrollmentId === 'enroll-1');
      expect(student1?.finalGrade).toBe(85);
      expect(student1?.academicStatus).toBe('APROBADO');

      const student2 = data.find(r => r.enrollmentId === 'enroll-2');
      expect(student2?.academicStatus).toBe('REPROBADO_POR_FALTAS');
    });

    it('should handle Semi-presencial (BLENDED) absence limit of 3', () => {
      mockOperationalService.subject.set({
        ...mockSubject,
        modality: 'BLENDED'
      });
      fixture.detectChanges();

      const data = component.tableData();
      const student1 = data.find(r => r.enrollmentId === 'enroll-1');
      expect(student1?.academicStatus).toBe('REPROBADO_POR_FALTAS');
    });
  });

  describe('Grade entry and Save functionality', () => {
    it('should compute final grades dynamically upon changes', () => {
      component.onGradeChange('enroll-2', 2, 45);
      fixture.detectChanges();

      const data = component.tableData();
      const student2 = data.find(r => r.enrollmentId === 'enroll-2');
      expect(student2?.finalGrade).toBe(65);
      expect(student2?.academicStatus).toBe('REPROBADO_POR_FALTAS');
    });

    it('should trigger save bulk grades request and show success message', async () => {
      component.onGradeChange('enroll-2', 2, 45);
      expect(component.canSave()).toBe(true);

      component.openSaveModal();
      expect(component.isSaveModalOpen()).toBe(true);

      await component.confirmSave();

      expect(mockGradeApi.saveGrades).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Las notas se guardaron correctamente.',
        'Guardado masivo'
      );
      expect(component.isSaveModalOpen()).toBe(false);
    });

    it('should handle save error gracefully', async () => {
      mockGradeApi.saveGrades.mockReturnValue(throwError(() => new Error('Server error')));
      component.onGradeChange('enroll-2', 2, 45);

      await component.confirmSave();

      expect(mockToast.error).toHaveBeenCalledWith('Server error', 'Guardado fallido');
    });
  });

  describe('Edge case functions and effects coverage', () => {
    it('should handle settings service loading failure', async () => {
      mockSettingsService.getGlobalSettings.mockReturnValue(throwError(() => new Error('Settings error')));
      fixture = TestBed.createComponent(GradeGridComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockToast.error).toHaveBeenCalledWith(
        'No se pudieron cargar los parámetros de configuración global.',
        'Configuración'
      );
    });

    it('should handle subject absences loading failure and toast warning', () => {
      mockAttendanceService.getSubjectAbsences.mockReturnValue(throwError(() => new Error('Absence error')));
      
      fixture = TestBed.createComponent(GradeGridComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Absence error',
        'Faltas no disponibles'
      );
    });

    it('should show toast error when contextError or studentsError signals are set', () => {
      mockOperationalService.contextError.set('Context loading failed');
      fixture.detectChanges();
      expect(mockToast.error).toHaveBeenCalledWith('Context loading failed', 'Carga de materia');
      expect(mockOperationalService.clearContextError).toHaveBeenCalled();

      mockOperationalService.studentsError.set('Students loading failed');
      fixture.detectChanges();
      expect(mockToast.error).toHaveBeenCalledWith('Students loading failed', 'Carga de estudiantes');
      expect(mockOperationalService.clearStudentsError).toHaveBeenCalled();
    });

    it('should show toast warning and ignore if payload grades are empty', async () => {
      // Clean components to trigger payload empty warning
      component.onGradeChange('enroll-1', 1, '');
      component.onGradeChange('enroll-1', 2, '');
      component.onGradeChange('enroll-2', 1, '');
      fixture.detectChanges();

      // Override computed canSave property to bypass early exit validation
      Object.defineProperty(component, 'canSave', {
        value: () => true
      });

      await component.confirmSave();
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Ingresa al menos una nota válida antes de guardar.',
        'Sin notas'
      );
    });

    it('should show error when students without valid enrollmentId are loaded', () => {
      const mockInvalidStudents = [
        { studentId: '', fullName: 'Ghost Student', ci: '999999', enrollmentId: '', degreeName: '', photoUrl: '' }
      ];
      // Reset initialization tracker to allow state rebuild
      (component as any).initializedSubjectId.set(null);
      mockOperationalService.students.set(mockInvalidStudents);
      fixture.detectChanges();

      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Se omitieron 1 estudiante(s) sin ID de matrícula válido'),
        'Datos inválidos'
      );
    });

    it('should navigate back on goBack()', () => {
      component.goBack();
      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should return correct component max weight, and default to 100 if not found', () => {
      expect(component.getComponentMax('component-1')).toBe(40);
      expect(component.getComponentMax('component-2')).toBe(60);
      expect(component.getComponentMax('component-99')).toBe(100);
    });

    it('should check cell validation correctly using isCellInvalid', () => {
      expect(component.isCellInvalid(null, 1)).toBe(false);
      expect(component.isCellInvalid('non-existent', 1)).toBe(false);
      expect(component.isCellInvalid('enroll-2', 1)).toBe(false);

      // Directly update draft rows with invalid values (bypassing normalizer)
      (component as any).gradeRowsDraft.update((rows: any[]) => 
        rows.map(r => r.enrollmentId === 'enroll-2' ? { ...r, scores: { ...r.scores, 1: 150 } } : r)
      );
      expect(component.isCellInvalid('enroll-2', 1)).toBe(true);

      (component as any).gradeRowsDraft.update((rows: any[]) => 
        rows.map(r => r.enrollmentId === 'enroll-2' ? { ...r, scores: { ...r.scores, 1: -10 } } : r)
      );
      expect(component.isCellInvalid('enroll-2', 1)).toBe(true);

      (component as any).gradeRowsDraft.update((rows: any[]) => 
        rows.map(r => r.enrollmentId === 'enroll-2' ? { ...r, scores: { ...r.scores, 1: NaN } } : r)
      );
      expect(component.isCellInvalid('enroll-2', 1)).toBe(true);
    });

    it('should return cell value correctly using getCellValue', () => {
      expect(component.getCellValue(null, 1)).toBe('');
      expect(component.getCellValue('enroll-1', 1)).toBe(35);
      expect(component.getCellValue('enroll-1', 99)).toBe('');
    });

    it('should extract error messages correctly from different types', () => {
      const errObj = { error: { message: 'Custom Backend Error' } };
      expect((component as any).extractErrorMessage(errObj, 'Fallback')).toBe('Custom Backend Error');

      const errorInstance = new Error('Instance Error');
      expect((component as any).extractErrorMessage(errorInstance, 'Fallback')).toBe('Instance Error');

      expect((component as any).extractErrorMessage('simple string', 'Fallback')).toBe('Fallback');
    });

    it('should prevent modal close if saving', () => {
      component.isSaving.set(true);
      component.isSaveModalOpen.set(true);
      component.closeSaveModal();
      expect(component.isSaveModalOpen()).toBe(true);
    });

    it('should do nothing on openSaveModal if cannot save', () => {
      component.isSaveModalOpen.set(false);
      // Make canSave return false by setting isSaving to true
      component.isSaving.set(true);
      fixture.detectChanges();
      component.openSaveModal();
      expect(component.isSaveModalOpen()).toBe(false);
    });

    it('should ignore onGradeChange if enrollmentId is null', () => {
      const spy = vi.spyOn(component as any, 'normalizeScoreValue');
      component.onGradeChange(null, 1, 50);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
