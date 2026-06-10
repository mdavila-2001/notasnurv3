import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TeacherAttendanceReport } from './teacher-attendance-report';
import { TeacherService } from '../../services/teacher.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';

describe('TeacherAttendanceReport', () => {
  let component: TeacherAttendanceReport;
  let fixture: ComponentFixture<TeacherAttendanceReport>;
  let mockTeacherService: any;
  let mockApiService: any;
  let mockToastService: any;

  const mockSubjects = [
    {
      id: 10,
      code: 'MAT-101',
      name: 'Matematica I',
      modality: 'FACE_TO_FACE',
      capacity: 30,
      recordStatus: 'ACTIVE',
      semesterId: 1,
      semesterName: 'Semestre 1',
      teacherId: 'usr-1',
      teacherName: 'Docente Prueba',
      management: '2026',
    }
  ];

  beforeEach(async () => {
    mockTeacherService = {
      getMySubjects: vi.fn().mockReturnValue(of(mockSubjects)),
    };

    mockApiService = {
      downloadBlob: vi.fn().mockReturnValue(of(new Blob(['excel-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TeacherAttendanceReport, HttpClientTestingModule],
      providers: [
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherAttendanceReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load teacher subjects on init', () => {
    expect(mockTeacherService.getMySubjects).toHaveBeenCalled();
    expect(component.subjects().length).toBe(1);
    expect(component.subjects()[0].code).toBe('MAT-101');
  });

  it('should filter subjects by search query', () => {
    component.searchFilter.set('Algebra');
    fixture.detectChanges();
    expect(component.filteredSubjects().length).toBe(0);

    component.searchFilter.set('Matematica');
    fixture.detectChanges();
    expect(component.filteredSubjects().length).toBe(1);
  });

  it('should download excel report successfully', () => {
    const subject = mockSubjects[0] as any;
    component.downloadExcel(subject);

    expect(mockApiService.downloadBlob).toHaveBeenCalledWith(
      '/reports/subjects/10/attendance/excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Reporte de asistencias para MAT-101 descargado.',
      'Descarga Exitosa'
    );
  });
});
