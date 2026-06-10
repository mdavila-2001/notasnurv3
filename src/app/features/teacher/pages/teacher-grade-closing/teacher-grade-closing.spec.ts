import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TeacherGradeClosing } from './teacher-grade-closing';
import { TeacherService } from '../../services/teacher.service';
import { AdminSubjectService, SubjectResponse } from '../../../admin/services/admin-subject.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';

describe('TeacherGradeClosing', () => {
  let component: TeacherGradeClosing;
  let fixture: ComponentFixture<TeacherGradeClosing>;
  let mockTeacherService: any;
  let mockAdminSubjectService: any;
  let mockApiService: any;
  let mockToastService: any;

  const mockSubjects: SubjectResponse[] = [
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
      teacherId: 'usr-1',
      teacherName: 'Juan Perez',
      management: '2026',
    }
  ];

  beforeEach(async () => {
    mockTeacherService = {
      getMySubjects: vi.fn().mockReturnValue(of(mockSubjects)),
    };

    mockAdminSubjectService = {
      close: vi.fn().mockReturnValue(of({ success: true, data: { ...mockSubjects[0], recordStatus: 'CLOSED' } })),
    };

    mockApiService = {
      downloadBlob: vi.fn().mockReturnValue(of(new Blob(['dummy pdf'], { type: 'application/pdf' }))),
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TeacherGradeClosing, HttpClientTestingModule],
      providers: [
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: AdminSubjectService, useValue: mockAdminSubjectService },
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherGradeClosing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load subjects on init', () => {
    expect(mockTeacherService.getMySubjects).toHaveBeenCalled();
    expect(component.subjects().length).toBe(2);
  });

  it('should filter subjects by search query', () => {
    component.searchFilter.set('Datos');
    fixture.detectChanges();
    expect(component.filteredSubjects().length).toBe(1);
    expect(component.filteredSubjects()[0].code).toBe('INF-302');
  });

  it('should filter subjects by record status', () => {
    component.statusFilter.set('CLOSED');
    fixture.detectChanges();
    expect(component.filteredSubjects().length).toBe(1);
    expect(component.filteredSubjects()[0].code).toBe('INF-302');
  });

  it('should download PDF report correctly and trigger download', () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const originalCreate = window.URL.createObjectURL;
    const originalRevoke = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    const subject = mockSubjects[0];
    component.downloadPdf(subject);

    expect(mockApiService.downloadBlob).toHaveBeenCalledWith(
      '/reports/subjects/1/grades-report/pdf',
      'application/pdf'
    );
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Acta en PDF de INF-301 descargada.',
      'Descarga Exitosa'
    );

    // Restore
    window.URL.createObjectURL = originalCreate;
    window.URL.revokeObjectURL = originalRevoke;
  });

  it('should show error toast if PDF report download fails', () => {
    mockApiService.downloadBlob.mockReturnValueOnce(throwError(() => new Error('Failed')));
    const subject = mockSubjects[0];
    component.downloadPdf(subject);

    expect(mockToastService.error).toHaveBeenCalledWith(
      'No se pudo descargar el acta en PDF.',
      'Error'
    );
  });

  it('should open and close close modal', () => {
    const subject = mockSubjects[0];
    component.openCloseModal(subject);
    expect(component.isCloseModalOpen()).toBe(true);
    expect(component.selectedSubject()).toEqual(subject);

    component.closeCloseModal();
    expect(component.isCloseModalOpen()).toBe(false);
    expect(component.selectedSubject()).toBeNull();
  });

  it('should not open modal if subject is already closed', () => {
    const subject = mockSubjects[1]; // CLOSED
    component.openCloseModal(subject);
    expect(component.isCloseModalOpen()).toBe(false);
  });

  it('should confirm close subject and update local list', () => {
    const subject = mockSubjects[0];
    component.openCloseModal(subject);
    component.confirmCloseSubject();

    expect(mockAdminSubjectService.close).toHaveBeenCalledWith('1');
    expect(component.subjects().find(s => s.id === '1')?.recordStatus).toBe('CLOSED');
    expect(component.isCloseModalOpen()).toBe(false);
    expect(mockToastService.success).toHaveBeenCalledWith(
      'La materia "Programacion III" ha sido cerrada correctamente.',
      'Cierre Completado'
    );
  });

  it('should show error toast if closing subject fails', () => {
    mockAdminSubjectService.close.mockReturnValueOnce(throwError(() => ({
      error: { message: 'Custom API Error' }
    })));
    const subject = mockSubjects[0];
    component.openCloseModal(subject);
    component.confirmCloseSubject();

    expect(mockToastService.error).toHaveBeenCalledWith(
      'Custom API Error',
      'Error'
    );
  });
});