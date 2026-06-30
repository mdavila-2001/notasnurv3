import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { StudentPortal } from './student-portal';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { ActivatedRoute } from '@angular/router';

describe('StudentPortal', () => {
  let component: StudentPortal;
  let fixture: ComponentFixture<StudentPortal>;
  let mockStudentPortalService: any; 

  const mockDashboardData = {
    mySubjects: [
      {
        subjectCode: 'ISC-301',
        subjectName: 'Ingeniería de Software',
        teacherName: 'Juan Perez',
        degreeName: 'Ingeniería de Sistemas',
        modality: 'FACE_TO_FACE',
        credits: 4,
        semesterName: 'Semestre 1'
      }
    ],
    userProfile: { ci: '1234567' },
    kardexHistory: {
      studentName: 'Maria Estudiante Ejemplo',
      degreeName: 'Ingeniería de Sistemas',
      historyBySemester: {
        'Gestión 2026 - Semestre 1': [
          {
            subjectCode: 'ISC-301',
            subjectName: 'Ingeniería de Software',
            finalScore: 85,
            status: 'PASSED',
            credits: 4
          }
        ]
      }
    }
  };

  beforeEach(async () => {
    mockStudentPortalService = {
      getStudentDashboardData: vi.fn()
    };
    
    mockStudentPortalService.getStudentDashboardData.mockReturnValue(of(mockDashboardData));

    await TestBed.configureTestingModule({
      imports: [
        StudentPortal, 
        HttpClientTestingModule 
      ],
      providers: [
        { provide: StudentPortalService, useValue: mockStudentPortalService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentPortal);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load student dashboard data on init', () => {
    fixture.detectChanges();
    expect(mockStudentPortalService.getStudentDashboardData).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false); 
    expect(component.mySubjects().length).toBe(1);
    expect(component.mySubjects()[0].subjectCode).toBe('ISC-301');
  });

  it('should render subject details inside cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.subjects-grid')).toBeTruthy();
    expect(compiled.textContent).toContain('Ingeniería de Software');
    expect(compiled.textContent).toContain('Juan Perez');
  });

  it('should transform Kardex data correctly', () => {
    fixture.detectChanges();
    const kardex = component.kardexHistory();
    expect(kardex).not.toBeNull();
    expect(kardex?.fullName).toBe('Maria Estudiante Ejemplo');
    expect(kardex?.academicStatus).toBe('Regular'); 
    expect(kardex?.entries.length).toBe(1);
  });

  it('should handle errors when loading data', () => {
    mockStudentPortalService.getStudentDashboardData.mockReturnValue(throwError(() => new Error('Error de conexión')));
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false); 
    expect(component.error()).toBe('Error de conexión');

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.error-container')).toBeTruthy();
    expect(compiled.textContent).toContain('Error de conexión');
  });

  it('should switch tabs and render Kardex table', () => {
    fixture.detectChanges();
    expect(component.activeTab()).toBe('subjects'); 
    
    component.setTab('kardex');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('kardex');

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.kardex-info-card')).toBeTruthy();
    expect(compiled.querySelector('app-table')).toBeTruthy();
  });

  it('should show empty state when subjects are empty', () => {
    const emptyData = {
      ...mockDashboardData,
      mySubjects: []
    };
    mockStudentPortalService.getStudentDashboardData.mockReturnValue(of(emptyData));
    fixture.detectChanges();

    expect(component.mySubjects().length).toBe(0);
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('No tienes materias matriculadas');
  });

  it('should call refreshData and trigger service call', () => {
    fixture.detectChanges();
    mockStudentPortalService.getStudentDashboardData.mockClear();

    component.refreshData();
    expect(mockStudentPortalService.getStudentDashboardData).toHaveBeenCalled();
  });

  it('should show loading container when isLoading is true', () => {
    fixture.detectChanges();
    component.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading-container')).toBeTruthy();
  });

  describe('Helper methods', () => {
    it('should resolve getGradeStatusClass correctly', () => {
      expect(component.getGradeStatusClass('PASSED')).toBe('status-passed');
      expect(component.getGradeStatusClass('FAILED')).toBe('status-failed');
      expect(component.getGradeStatusClass('INCOMPLETE')).toBe('status-incomplete');
      expect(component.getGradeStatusClass('PENDING')).toBe('status-pending');
      expect(component.getGradeStatusClass('DROPPED')).toBe('status-dropped');
      expect(component.getGradeStatusClass('ACTIVE')).toBe('status-pending');
      expect(component.getGradeStatusClass('UNKNOWN')).toBe('status-default');
    });

    it('should resolve getStatusLabel correctly', () => {
      expect(component.getStatusLabel('PASSED')).toBe('Aprobado');
      expect(component.getStatusLabel('FAILED')).toBe('Reprobado');
      expect(component.getStatusLabel('INCOMPLETE')).toBe('Incompleto');
      expect(component.getStatusLabel('PENDING')).toBe('Pendiente');
      expect(component.getStatusLabel('DROPPED')).toBe('Retirado');
      expect(component.getStatusLabel('ACTIVE')).toBe('Cursando');
      expect(component.getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should resolve getModalityLabel correctly', () => {
      expect(component.getModalityLabel('FACE_TO_FACE')).toBe('Presencial');
      expect(component.getModalityLabel('BLENDED')).toBe('Semipresencial');
      expect(component.getModalityLabel('ONLINE')).toBe('Virtual');
      expect(component.getModalityLabel(undefined)).toBe('Virtual');
      expect(component.getModalityLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should format grades correctly', () => {
      expect(component.formatGrade(85.556)).toBe('85.56');
      expect(component.formatGrade('85.556')).toBe('85.56');
      expect(component.formatGrade('N/A')).toBe('-');
    });
  });
});