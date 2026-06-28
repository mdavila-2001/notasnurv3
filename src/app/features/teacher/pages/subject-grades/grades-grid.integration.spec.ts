import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GradeGridComponent } from './grade-grid.component';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { CURRENT_DATE } from '../../../../core/services/settings/current-date.token';
import { environment } from '../../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { of } from 'rxjs';

describe('GradesGrid Integration', () => {
  let fixture: ComponentFixture<GradeGridComponent>;
  let component: GradeGridComponent;
  let operationalService: SubjectOperationalService;
  let httpMock: HttpTestingController;
  let toast: ToastService;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeGridComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SubjectOperationalService,
        GlobalSettingsService,
        {
          provide: CURRENT_DATE,
          useValue: () => new Date('2026-06-24')
        },
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn()
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => '12' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GradeGridComponent);
    component = fixture.componentInstance;
    operationalService = TestBed.inject(SubjectOperationalService);
    toast = TestBed.inject(ToastService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    operationalService.clearStore();
    TestBed.resetTestingModule();
  });

  it('should load settings, students, plan, grades, and successfully recalculate and save grades', async () => {
    // 1. Initial render -> triggers effect that loads context and setting fetches
    fixture.detectChanges();

    // Mock global settings fetch
    const settingsReq = httpMock.expectOne(`${baseUrl}/settings/global`);
    expect(settingsReq.request.method).toBe('GET');
    settingsReq.flush({
      success: true,
      data: {
        academic: { globalGradesDeadline: '2026-06-30' },
        institutional: { allowLateGradesEntry: false }
      }
    });

    // Mock subject operational context loads
    const subjectReq = httpMock.expectOne(`${baseUrl}/subjects/12`);
    subjectReq.flush({
      success: true,
      data: {
        id: 12,
        name: 'Álgebra Lineal',
        modality: 'PRESENCIAL' // Presencial limit: 5 absences
      }
    });

    const studentsReq = httpMock.expectOne(`${baseUrl}/enrollments/subjects/12/students`);
    studentsReq.flush({
      success: true,
      data: [
        { id: 'enroll-1', studentId: 'student-1', fullName: 'Alice', ci: '123', email: 'alice@nur.edu', degreeName: 'Ingeniería' }
      ]
    });

    const planReq = httpMock.expectOne(`${baseUrl}/evaluation-plans/subject/12`);
    planReq.flush({
      success: true,
      data: {
        id: 101,
        subjectId: 12,
        components: [
          { id: 201, name: 'Parcial I', weight: 40, description: '' },
          { id: 202, name: 'Examen Final', weight: 60, description: '' }
        ]
      }
    });

    // Mock initial grades fetch
    const gradesReq = httpMock.expectOne(`${baseUrl}/grades/subject/12`);
    gradesReq.flush({
      success: true,
      data: [
        { enrollmentId: 'enroll-1', componentId: 201, score: 30 } // Parcial I = 30, Examen Final = null (pending)
      ]
    });

    // Mock absences fetch from AttendanceService
    const absencesReq = httpMock.expectOne(`${baseUrl}/attendance/subject/12/absences`);
    absencesReq.flush({
      success: true,
      data: [
        { enrollmentId: 'enroll-1', absencesCount: 2 } // 2 absences < 5 limit
      ]
    });

    await fixture.whenStable();
    fixture.detectChanges();

    // Verify recalculations
    let rows = component.tableData();
    expect(rows.length).toBe(1);
    expect(rows[0].scores[201]).toBe(30);
    expect(rows[0].scores[202]).toBeNull();
    expect(rows[0].finalGrade).toBe(30);
    expect(rows[0].academicStatus).toBe('PENDIENTE');

    // 2. Simulate user typing a grade for the second component (Examen Final = 55)
    component.onGradeChange('enroll-1', 202, 55);
    fixture.detectChanges();

    rows = component.tableData();
    // Parcial I (30) + Examen Final (55) = 85
    expect(rows[0].scores[202]).toBe(55);
    expect(rows[0].finalGrade).toBe(85);
    expect(rows[0].academicStatus).toBe('APROBADO');

    // 3. Open save modal and save
    expect(component.canSave()).toBe(true);
    component.openSaveModal();
    fixture.detectChanges();
    expect(component.isSaveModalOpen()).toBe(true);

    component.confirmSave();
    const saveReq = httpMock.expectOne(`${baseUrl}/grades/save`);
    expect(saveReq.request.method).toBe('POST');
    expect(saveReq.request.body.grades).toContainEqual({
      enrollmentId: 'enroll-1',
      componentId: 201,
      score: 30
    });
    expect(saveReq.request.body.grades).toContainEqual({
      enrollmentId: 'enroll-1',
      componentId: 202,
      score: 55
    });

    saveReq.flush({ success: true });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isSaveModalOpen()).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Las notas se guardaron correctamente.', 'Guardado masivo');
  });
});
