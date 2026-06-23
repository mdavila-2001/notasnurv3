import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

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
      contextError: signal(null),
      studentsError: signal(null),
      loadSubjectContext: vi.fn(),
      clearContextError: vi.fn(),
      clearStudentsError: vi.fn(),
      clearStore: vi.fn(),
    };

    mockAttendanceService = {
      getSubjectAbsences: vi.fn().mockReturnValue(of(new Map([
        ['enroll-1', 4], // Presencial (limit 5): 4 absences -> Regular / At Risk
        ['enroll-2', 5]  // Presencial (limit 5): 5 absences -> Reprobado por Faltas
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

    // By default, current date is BEFORE deadline
    mockCurrentDateFn = vi.fn().mockReturnValue(new Date(2026, 5, 15));

    await TestBed.configureTestingModule({
      imports: [GradeGridComponent, HttpClientTestingModule],
      providers: [
        { provide: SubjectOperationalService, useValue: mockOperationalService },
        { provide: GlobalSettingsService, useValue: mockSettingsService },
        { provide: ToastService, useValue: mockToast },
        { provide: CURRENT_DATE, useValue: mockCurrentDateFn },
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

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load global settings and compute signals on init', () => {
    expect(mockSettingsService.getGlobalSettings).toHaveBeenCalled();
    expect(component.globalSettings()).toEqual(mockSettings);
  });

  describe('Req 6: Grades Closing and Date Lock Validation', () => {
    // Req 6: En el componente de entrada de notas, inyecta una fecha ficticia (mock date) y verifica que los inputs HTML se deshabiliten si la fecha actual es mayor a la fecha límite configurada.

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
      expect(component.canSave()).toBe(false); // cannot save when locked
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
    // Req 7: Prueba la lógica condicional que alerta sobre estudiantes en riesgo / reprobados por faltas según modalidad.

    it('should evaluate student status correctly based on modality and absence limit (>= check)', () => {
      // Carlos has 4 absences, which is < 5 limit for Presencial. Grade: 35 + 50 = 85 (>= 51 Passing grade)
      const data = component.tableData();
      const student1 = data.find(r => r.enrollmentId === 'enroll-1');
      expect(student1?.finalGrade).toBe(85);
      expect(student1?.academicStatus).toBe('APROBADO');

      // Ana has 5 absences, which reaches/exceeds the 5 limit for Presencial.
      // So she is Reprobado por Faltas despite final grade if completed or otherwise
      const student2 = data.find(r => r.enrollmentId === 'enroll-2');
      expect(student2?.academicStatus).toBe('REPROBADO_POR_FALTAS');
    });

    it('should handle Semi-presencial (BLENDED) absence limit of 3', () => {
      // Change subject modality to BLENDED
      mockOperationalService.subject.set({
        ...mockSubject,
        modality: 'BLENDED'
      });
      fixture.detectChanges();

      // Now limit is 3. Carlos has 4 absences. Since 4 >= 3, Carlos status is REPROBADO_POR_FALTAS
      const data = component.tableData();
      const student1 = data.find(r => r.enrollmentId === 'enroll-1');
      expect(student1?.academicStatus).toBe('REPROBADO_POR_FALTAS');
    });
  });

  describe('Grade entry and Save functionality', () => {
    it('should compute final grades dynamically upon changes', () => {
      // Trigger grade change for Ana (enroll-2) on Component 2 (Examen 2)
      component.onGradeChange('enroll-2', 2, 45);
      fixture.detectChanges();

      const data = component.tableData();
      const student2 = data.find(r => r.enrollmentId === 'enroll-2');
      expect(student2?.finalGrade).toBe(65); // 20 (Parcial 1) + 45 (Parcial 2)
      expect(student2?.academicStatus).toBe('REPROBADO_POR_FALTAS'); // Still reprobado by absences (5 absences)
    });

    it('should trigger save bulk grades request and show success message', async () => {
      // Ana (enroll-2) Component 2 is changed
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
});
