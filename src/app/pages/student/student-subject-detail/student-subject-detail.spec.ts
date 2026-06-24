import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { StudentSubjectDetail } from './student-subject-detail';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('StudentSubjectDetail', () => {
  let component: StudentSubjectDetail;
  let fixture: ComponentFixture<StudentSubjectDetail>;
  let mockStudentPortalService: any;
  let mockToastService: any;
  let mockRouter: any;
  let activeRouteParam: string | null = 'ISC-301';

  const mockDashboardData = {
    studentName: 'Maria Estudiante Ejemplo',
    degreeName: 'Ingeniería de Sistemas',
    currentGPA: 85.5,
    enrolledSubjects: [
      {
        subjectId: 12,
        subjectName: 'Ingeniería de Software',
        subjectCode: 'ISC-301',
        teacherName: 'Juan Perez',
        category: 'OBLIGATORIA',
        currentGrade: 78.5,
        absences: 2,
        absenceLimit: 5,
        atRisk: false,
        gradeBreakdown: [
          { name: 'Primer Parcial', score: 80.0, weight: 30.0 },
          { name: 'Segundo Parcial', score: 75.0, weight: 30.0 },
          { name: 'Proyecto Final', score: 80.0, weight: 40.0 }
        ]
      }
    ]
  };

  beforeEach(async () => {
    activeRouteParam = 'ISC-301';

    mockStudentPortalService = {
      getStudentDashboard: vi.fn().mockReturnValue(of(mockDashboardData))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [StudentSubjectDetail, HttpClientTestingModule],
      providers: [
        { provide: StudentPortalService, useValue: mockStudentPortalService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => (key === 'id' ? activeRouteParam : null)
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSubjectDetail);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load subject grades detail on init matching subjectCode', () => {
    fixture.detectChanges();
    expect(mockStudentPortalService.getStudentDashboard).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.subjectDetail()).not.toBeNull();
    expect(component.subjectDetail().subjectName).toBe('Ingeniería de Software');
    expect(component.finalGrade()).toBe(78.5);
    expect(component.absencesCount()).toBe(2);
  });

  it('should compute academic status correctly as APPROVED', () => {
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('APPROVED');
  });

  it('should compute academic status correctly as FAILED_BY_ABSENCES when limit reached', () => {
    fixture.detectChanges();
    component.subjectDetail.set({
      ...mockDashboardData.enrolledSubjects[0],
      absences: 5,
      absenceLimit: 5
    });
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('FAILED_BY_ABSENCES');
  });

  it('should compute academic status correctly as FAILED when score below 51', () => {
    fixture.detectChanges();
    component.subjectDetail.set({
      ...mockDashboardData.enrolledSubjects[0],
      currentGrade: 45.0,
      absences: 1
    });
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('FAILED');
  });

  it('should compute academic status correctly as ACTIVE when score is 0 and within absences', () => {
    fixture.detectChanges();
    component.subjectDetail.set({
      ...mockDashboardData.enrolledSubjects[0],
      currentGrade: 0.0,
      absences: 1
    });
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('ACTIVE');
  });

  it('should return PENDING for academicStatus if subjectDetail is null', () => {
    fixture.detectChanges();
    component.subjectDetail.set(null);
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('PENDING');
  });

  it('should format grade breakdown table rows correctly and handle default names', () => {
    fixture.detectChanges();
    const data = component.tableData();
    expect(data.length).toBe(3);
    expect(data[0].componentName).toBe('Primer Parcial');
    expect(data[0].weight).toBe('30%');
    expect(data[0].obtainedScore).toBe('80.00');
    expect(data[0].contribution).toBe('24.00');

    // Test with missing names and default weight/score
    component.subjectDetail.set({
      ...mockDashboardData.enrolledSubjects[0],
      gradeBreakdown: [
        { name: '', score: undefined, weight: undefined }
      ]
    });
    fixture.detectChanges();
    const updatedData = component.tableData();
    expect(updatedData.length).toBe(1);
    expect(updatedData[0].componentName).toBe('Componente de Evaluación');
    expect(updatedData[0].weight).toBe('0%');
    expect(updatedData[0].obtainedScore).toBe('0.00');
    expect(updatedData[0].contribution).toBe('0.00');
  });

  it('should navigate back to student dashboard', () => {
    fixture.detectChanges();
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/student/dashboard']);
  });

  it('should handle API errors and show warning message', () => {
    mockStudentPortalService.getStudentDashboard.mockReturnValue(throwError(() => new Error('Error general')));
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('Error general');
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should handle null/missing id parameter from active route', () => {
    activeRouteParam = null;
    fixture = TestBed.createComponent(StudentSubjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toContain('No se proporcionó un código o identificador');
  });

  it('should handle dashboard response without enrolledSubjects', () => {
    mockStudentPortalService.getStudentDashboard.mockReturnValue(of({ studentName: 'Name Only' }));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toContain('No se encontró información de materias activas');
  });

  it('should handle dashboard response with subject not found', () => {
    mockStudentPortalService.getStudentDashboard.mockReturnValue(of({ enrolledSubjects: [] }));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toContain('No estás matriculado en la materia con código/ID');
  });

  it('should return correct CSS classes and labels for statuses', () => {
    fixture.detectChanges();
    expect(component.getStatusClass('APPROVED')).toBe('badge-approved');
    expect(component.getStatusClass('FAILED')).toBe('badge-failed');
    expect(component.getStatusClass('FAILED_BY_ABSENCES')).toBe('badge-absences');
    expect(component.getStatusClass('ACTIVE')).toBe('badge-active');
    expect(component.getStatusClass('UNKNOWN')).toBe('badge-pending');

    expect(component.getStatusLabel('APPROVED')).toBe('Aprobado');
    expect(component.getStatusLabel('FAILED')).toBe('Reprobado');
    expect(component.getStatusLabel('FAILED_BY_ABSENCES')).toBe('Reprobado por Faltas');
    expect(component.getStatusLabel('ACTIVE')).toBe('Cursando');
    expect(component.getStatusLabel('UNKNOWN')).toBe('Pendiente');
  });
});
