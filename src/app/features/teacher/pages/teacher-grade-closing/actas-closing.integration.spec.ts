import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TeacherGradeClosing } from './teacher-grade-closing';
import { TeacherService } from '../../services/teacher.service';
import { AdminSubjectService } from '../../../admin/services/admin-subject.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('ActasClosing Integration', () => {
  let fixture: ComponentFixture<TeacherGradeClosing>;
  let component: TeacherGradeClosing;
  let httpMock: HttpTestingController;
  let toast: ToastService;
  const baseUrl = environment.apiBaseUrl;

  const mockSubjects = [
    { id: 10, name: 'Álgebra Lineal', code: 'MAT-101', recordStatus: 'OPEN', teacherName: 'Juan' },
    { id: 11, name: 'Cálculo I', code: 'MAT-102', recordStatus: 'CLOSED', teacherName: 'Juan' }
  ];

  beforeEach(async () => {
    // Spy on window APIs to prevent errors during download mockings
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn()
    });

    await TestBed.configureTestingModule({
      imports: [TeacherGradeClosing],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TeacherService,
        AdminSubjectService,
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherGradeClosing);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('should list subjects, close an open subject, update local status, and trigger PDF report download', () => {
    // 1. Initial render -> fetches subjects from API
    fixture.detectChanges();

    const getReq = httpMock.expectOne(`${baseUrl}/subjects/my-subjects`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockSubjects);

    fixture.detectChanges();

    expect(component.subjects().length).toBe(2);
    expect(component.filteredSubjects().length).toBe(2);

    // 2. Open confirmation modal for Álgebra Lineal (id: 10, recordStatus: 'OPEN')
    component.openCloseModal(mockSubjects[0] as any);
    fixture.detectChanges();

    expect(component.isCloseModalOpen()).toBe(true);
    expect(component.selectedSubject()).toEqual(mockSubjects[0]);

    // 3. Confirm closing subject -> triggers PUT /subjects/10/close
    component.confirmCloseSubject();
    
    const closeReq = httpMock.expectOne(`${baseUrl}/subjects/10/close`);
    expect(closeReq.request.method).toBe('PUT');
    closeReq.flush({
      success: true,
      data: { ...mockSubjects[0], recordStatus: 'CLOSED' }
    });

    fixture.detectChanges();

    // Verify modal is closed, status is updated, and success toast is shown
    expect(component.isCloseModalOpen()).toBe(false);
    expect(component.subjects()[0].recordStatus).toBe('CLOSED');
    expect(toast.success).toHaveBeenCalledWith(
      'La materia "Álgebra Lineal" ha sido cerrada correctamente.',
      'Cierre Completado'
    );

    // 4. Download PDF for closed subject (id: 10)
    component.downloadPdf(component.subjects()[0] as any);

    const pdfReq = httpMock.expectOne(`${baseUrl}/reports/subjects/10/grades-report/pdf`);
    expect(pdfReq.request.method).toBe('GET');
    
    // Flush a mock blob response
    const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
    pdfReq.flush(mockBlob);

    fixture.detectChanges();

    expect(toast.success).toHaveBeenCalledWith(
      'Acta en PDF de MAT-101 descargada.',
      'Descarga Exitosa'
    );
  });
});
