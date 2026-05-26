import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StudentSubjectDetail } from './student-subject-detail';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('StudentSubjectDetail', () => {
  let component: StudentSubjectDetail;
  let fixture: ComponentFixture<StudentSubjectDetail>;
  let mockStudentPortalService: any;
  let mockToastService: any;
  let mockRouter: any;

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
              get: (key: string) => (key === 'id' ? 'ISC-301' : null)
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSubjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load subject grades detail on init matching subjectCode', () => {
    expect(mockStudentPortalService.getStudentDashboard).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.subjectDetail()).not.toBeNull();
    expect(component.subjectDetail().subjectName).toBe('Ingeniería de Software');
    expect(component.finalGrade()).toBe(78.5);
    expect(component.absencesCount()).toBe(2);
  });

  it('should compute academic status correctly as APPROVED', () => {
    expect(component.academicStatus()).toBe('APPROVED');
  });

  it('should compute academic status correctly as FAILED_BY_ABSENCES when limit reached', () => {
    // Manually trigger change to trigger computed values
    component.subjectDetail.set({
      ...mockDashboardData.enrolledSubjects[0],
      absences: 5,
      absenceLimit: 5
    });
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('FAILED_BY_ABSENCES');
  });

  it('should compute academic status correctly as FAILED when score below 51', () => {
    component.subjectDetail.set({
      ...mockDashboardData.enrolledSubjects[0],
      currentGrade: 45.0,
      absences: 1
    });
    fixture.detectChanges();
    expect(component.academicStatus()).toBe('FAILED');
  });

  it('should format grade breakdown table rows correctly', () => {
    const data = component.tableData();
    expect(data.length).toBe(3);
    expect(data[0].componentName).toBe('Primer Parcial');
    expect(data[0].weight).toBe('30%');
    expect(data[0].obtainedScore).toBe('80.00');
    expect(data[0].contribution).toBe('24.00'); // (80 * 30) / 100 = 24
  });

  it('should navigate back to student dashboard', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/student/dashboard']);
  });

  it('should handle API errors and show warning message', () => {
    mockStudentPortalService.getStudentDashboard.mockReturnValue(throwError(() => new Error('Error general')));
    component.loadSubjectGrades('ISC-301');
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('Error general');
    expect(mockToastService.error).toHaveBeenCalled();
  });
});
