import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest'; 
import { StudentPortal } from './student-portal';
import { StudentPortalService } from '../../../core/services/student-portal.service';

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
        modality: 'FACE_TO_FACE'
      }
    ],
    userProfile: { ci: '1234567' }, // Agregado para evitar error de undefined
    kardexHistory: {
      studentName: 'Maria Estudiante Ejemplo',
      degreeName: 'Ingeniería de Sistemas',
      historyBySemester: {
        'Gestión 2026 - Semestre 1': [
          {
            subjectCode: 'ISC-301',
            subjectName: 'Ingeniería de Software',
            finalScore: null,
            status: 'ACTIVE'
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
        { provide: StudentPortalService, useValue: mockStudentPortalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentPortal);
    component = fixture.componentInstance;
    
    fixture.detectChanges(); 
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load student dashboard data on init', () => {
    expect(mockStudentPortalService.getStudentDashboardData).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false); 
    expect(component.mySubjects().length).toBe(1);
    expect(component.mySubjects()[0].subjectCode).toBe('ISC-301');
  });

  it('should transform Kardex data correctly', () => {
    const kardex = component.kardexHistory();
    expect(kardex).not.toBeNull();
    expect(kardex?.fullName).toBe('Maria Estudiante Ejemplo');
    expect(kardex?.academicStatus).toBe('Regular (Cursando)'); 
    expect(kardex?.entries.length).toBe(1);
  });

  it('should handle errors when loading data', () => {
    mockStudentPortalService.getStudentDashboardData.mockReturnValue(throwError(() => new Error('Error de conexión')));
    component.refreshData();
    expect(component.isLoading()).toBe(false); 
    expect(component.error()).toBe('Error de conexión');
  });

  it('should switch tabs correctly', () => {
    expect(component.activeTab()).toBe('subjects'); 
    component.setTab('kardex');
    expect(component.activeTab()).toBe('kardex');
  });
});