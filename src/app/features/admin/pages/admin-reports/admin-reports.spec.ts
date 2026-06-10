import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminReports } from './admin-reports';
import { AdminSubjectService } from '../../services/admin-subject.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';

describe('AdminReports', () => {
  let component: AdminReports;
  let fixture: ComponentFixture<AdminReports>;
  let mockAdminSubjectService: any;
  let mockApiService: any;
  let mockToastService: any;

  const mockSubjects = [
    {
      id: '1',
      code: 'INF-301',
      name: 'Programacion III',
      modality: 'FACE_TO_FACE',
      capacity: 30,
      recordStatus: 'ACTIVE',
      semesterId: '1',
      semesterName: 'Semestre 1',
      teacherId: 'usr-1',
      teacherName: 'Juan Perez',
      management: '2026',
    },
    {
      id: '2',
      code: 'INF-302',
      name: 'Base de Datos I',
      modality: 'BLENDED',
      capacity: 25,
      recordStatus: 'CLOSED',
      semesterId: '1',
      semesterName: 'Semestre 1',
      teacherId: 'usr-2',
      teacherName: 'Maria Gomez',
      management: '2026',
    }
  ];

  beforeEach(async () => {
    mockAdminSubjectService = {
      getAll: vi.fn().mockReturnValue(of({ success: true, data: mockSubjects })),
      close: vi.fn().mockReturnValue(of({ success: true, data: { ...mockSubjects[0], recordStatus: 'CLOSED' } })),
    };

    mockApiService = {
      downloadBlob: vi.fn().mockReturnValue(of(new Blob(['dummy content'], { type: 'application/pdf' }))),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminReports, HttpClientTestingModule],
      providers: [
        { provide: AdminSubjectService, useValue: mockAdminSubjectService },
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load subjects on init', () => {
    expect(mockAdminSubjectService.getAll).toHaveBeenCalled();
    expect(component.subjects().length).toBe(2);
  });

  it('should filter subjects by search text', () => {
    component.searchFilter.set('Gomez');
    fixture.detectChanges();
    expect(component.filteredSubjects().length).toBe(1);
    expect(component.filteredSubjects()[0].code).toBe('INF-302');
  });

  it('should filter subjects by status', () => {
    component.statusFilter.set('CLOSED');
    fixture.detectChanges();
    expect(component.filteredSubjects().length).toBe(1);
    expect(component.filteredSubjects()[0].code).toBe('INF-302');
  });

  it('should download PDF report correctly', () => {
    const subject = mockSubjects[0] as any;
    component.downloadPdf(subject);
    expect(mockApiService.downloadBlob).toHaveBeenCalledWith(
      '/reports/subjects/1/grades-report/pdf',
      'application/pdf'
    );
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Acta PDF descargada correctamente.',
      'Reporte PDF'
    );
  });

  it('should download Excel report correctly', () => {
    const subject = mockSubjects[0] as any;
    component.downloadExcel(subject);
    expect(mockApiService.downloadBlob).toHaveBeenCalledWith(
      '/reports/subjects/1/attendance/excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Reporte de asistencias descargado correctamente.',
      'Reporte Excel'
    );
  });

  it('should open close modal', () => {
    const subject = mockSubjects[0] as any;
    component.openCloseModal(subject);
    expect(component.isCloseModalOpen()).toBe(true);
    expect(component.selectedSubject()).toEqual(subject);
  });

  it('should confirm close subject and update status', () => {
    const subject = mockSubjects[0] as any;
    component.openCloseModal(subject);
    component.confirmCloseSubject();

    expect(mockAdminSubjectService.close).toHaveBeenCalledWith('1');
    expect(component.subjects().find(s => s.id === '1')?.recordStatus).toBe('CLOSED');
    expect(component.isCloseModalOpen()).toBe(false);
  });
});
