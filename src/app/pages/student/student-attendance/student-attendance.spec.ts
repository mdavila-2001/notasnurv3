import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StudentAttendance } from './student-attendance';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { provideRouter } from '@angular/router';

describe('StudentAttendance', () => {
  let component: StudentAttendance;
  let fixture: ComponentFixture<StudentAttendance>;
  let mockStudentPortalService: any;

  const mockDashboardData = {
    studentName: 'Maria Estudiante',
    degreeName: 'Ingeniería de Sistemas',
    currentGPA: 85.5,
    enrolledSubjects: [
      {
        subjectId: 10,
        subjectName: 'Física I',
        subjectCode: 'FIS-101',
        teacherName: 'Juan Perez',
        absences: 1,
        absenceLimit: 5,
        atRisk: false
      },
      {
        subjectId: 11,
        subjectName: 'Taller V',
        subjectCode: 'SIS-101',
        teacherName: 'Docente Dos',
        absences: 4,
        absenceLimit: 5,
        atRisk: false
      }
    ]
  };

  beforeEach(async () => {
    mockStudentPortalService = {
      getStudentDashboard: vi.fn().mockReturnValue(of(mockDashboardData))
    };

    await TestBed.configureTestingModule({
      imports: [StudentAttendance, HttpClientTestingModule],
      providers: [
        { provide: StudentPortalService, useValue: mockStudentPortalService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentAttendance);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load student attendance data on init', () => {
    expect(mockStudentPortalService.getStudentDashboard).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.enrolledSubjects().length).toBe(2);
  });

  describe('Req 7: Conditional Risk and Status logic by Modality', () => {
    it('should compute status as "Regular" when absences are well below limit', () => {
      const data = component.tableData();
      const firstSubject = data.find(s => s.subjectCode === 'FIS-101');
      expect(firstSubject?.status).toBe('Regular');
      expect(firstSubject?.atRisk).toBe(false);
    });

    it('should compute status as "En Riesgo" for Presencial (limit 5) when absences = 4 (limit - 1)', () => {
      const data = component.tableData();
      const secondSubject = data.find(s => s.subjectCode === 'SIS-101');
      expect(secondSubject?.status).toBe('En Riesgo');
      expect(secondSubject?.atRisk).toBe(true);
    });

    it('should compute status as "Reprobado por Faltas" for Presencial (limit 5) when absences = 5 (limit reached)', () => {
      component.enrolledSubjects.set([
        {
          subjectId: 12,
          subjectName: 'Química General',
          subjectCode: 'QMC-101',
          teacherName: 'Quimico Perez',
          absences: 5,
          absenceLimit: 5,
          atRisk: false
        }
      ]);
      fixture.detectChanges();

      const data = component.tableData();
      const chemSubject = data.find(s => s.subjectCode === 'QMC-101');
      expect(chemSubject?.status).toBe('Reprobado por Faltas');
      expect(chemSubject?.atRisk).toBe(false);
    });

    it('should compute status as "En Riesgo" for Semi-presencial (limit 3) when absences = 2 (limit - 1)', () => {
      component.enrolledSubjects.set([
        {
          subjectId: 13,
          subjectName: 'Base de Datos I',
          subjectCode: 'SIS-201',
          teacherName: 'BD Teacher',
          absences: 2,
          absenceLimit: 3,
          atRisk: false
        }
      ]);
      fixture.detectChanges();

      const data = component.tableData();
      const dbSubject = data.find(s => s.subjectCode === 'SIS-201');
      expect(dbSubject?.status).toBe('En Riesgo');
      expect(dbSubject?.atRisk).toBe(true);
    });

    it('should compute status as "Reprobado por Faltas" for Semi-presencial (limit 3) when absences = 3 (limit reached)', () => {
      component.enrolledSubjects.set([
        {
          subjectId: 13,
          subjectName: 'Base de Datos I',
          subjectCode: 'SIS-201',
          teacherName: 'BD Teacher',
          absences: 3,
          absenceLimit: 3,
          atRisk: false
        }
      ]);
      fixture.detectChanges();

      const data = component.tableData();
      const dbSubject = data.find(s => s.subjectCode === 'SIS-201');
      expect(dbSubject?.status).toBe('Reprobado por Faltas');
      expect(dbSubject?.atRisk).toBe(false);
    });
  });

  it('should get correct badge status class', () => {
    expect(component.getStatusClass('Regular')).toBe('badge-approved');
    expect(component.getStatusClass('En Riesgo')).toBe('badge-at-risk');
    expect(component.getStatusClass('Reprobado por Faltas')).toBe('badge-absences');
  });

  it('should handle API errors during data load', () => {
    mockStudentPortalService.getStudentDashboard.mockReturnValue(throwError(() => new Error('API connection error')));
    component.loadAttendanceData();
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('API connection error');
  });
});
