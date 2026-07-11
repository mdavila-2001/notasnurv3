import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReportService } from './report.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';
import { AdminSubjectService } from '../../admin/services/admin-subject.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  let operationalService: SubjectOperationalService;

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  const mockSubjectService = {
    close: vi.fn(),
  };

  beforeEach(() => {
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockSubjectService.close.mockReset();

    TestBed.configureTestingModule({
      providers: [
        ReportService,
        SubjectOperationalService,
        { provide: ToastService, useValue: mockToast },
        { provide: AdminSubjectService, useValue: mockSubjectService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
    operationalService = TestBed.inject(SubjectOperationalService);

    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));

    operationalService.setSubjectDirectly({ id: '99', name: 'Materia 99', recordStatus: 'OPEN' } as any);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('reportOptions', () => {
    it('should provide two report options', () => {
      expect(service.reportOptions.length).toBe(2);
    });

    it('should have correct grades-pdf config', () => {
      const pdf = service.reportOptions.find(r => r.type === 'grades-pdf');
      expect(pdf?.label).toContain('PDF');
      expect(pdf?.endpoint('99')).toBe('/reports/subjects/99/grades-report/pdf');
      expect(pdf?.filename('99')).toBe('grades-report-subject-99.pdf');
    });

    it('should have correct grades-excel config', () => {
      const excel = service.reportOptions.find(r => r.type === 'grades-excel');
      expect(excel?.label).toContain('Excel');
      expect(excel?.endpoint('99')).toBe('/reports/subjects/99/attendance/excel');
      expect(excel?.filename('99')).toBe('attendance-report-subject-99.xlsx');
    });
  });

  describe('download', () => {
    it('should download PDF and trigger browser download', () => {
      let result = false;
      service.download('grades-pdf').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/reports/subjects/99/grades-report/pdf');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['%PDF'], { type: 'application/pdf' }));

      expect(result).toBe(true);
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Acta PDF descargada correctamente.',
        'Reporte generado'
      );
      expect(service.isDownloading()).toBeNull();
    });

    it('should download Excel and trigger browser download', () => {
      let result = false;
      service.download('grades-excel').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/reports/subjects/99/attendance/excel');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['EXCEL'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

      expect(result).toBe(true);
      expect(mockToast.success).toHaveBeenCalledWith(
        'Reporte Excel descargado correctamente.',
        'Reporte generado'
      );
    });

    it('should handle download failure', () => {
      let result = true;
      service.download('grades-pdf').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/reports/subjects/99/grades-report/pdf');
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(result).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith(
        'No se pudo descargar el acta PDF.',
        'Error de descarga'
      );
      expect(service.isDownloading()).toBeNull();
    });

    it('should set isDownloading during request', () => {
      service.download('grades-pdf').subscribe();
      expect(service.isDownloading()).toBe('grades-pdf');

      httpMock.expectOne('/api/reports/subjects/99/grades-report/pdf').flush(new Blob());
      expect(service.isDownloading()).toBeNull();
    });

    it('should return false for invalid or missing subject', () => {
      operationalService.clearStore();

      let result = true;
      service.download('grades-pdf').subscribe((r: boolean) => { result = r; });
      expect(result).toBe(false);
    });
  });

  describe('closeSubject', () => {
    it('should call subjectService.close and update operational subject status', () => {
      const closedSubject = { id: '99', name: 'Materia 99', recordStatus: 'CLOSED' };
      mockSubjectService.close.mockReturnValue(of({ success: true, message: 'Closed', data: closedSubject }));

      let result = false;
      service.closeSubject().subscribe(r => { result = r; });

      expect(mockSubjectService.close).toHaveBeenCalledWith('99');
      expect(result).toBe(true);
      expect(service.isSubjectClosed()).toBe(true);
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('should handle subject close error gracefully', () => {
      mockSubjectService.close.mockReturnValue(throwError(() => new Error('Error')));

      let result = true;
      service.closeSubject().subscribe(r => { result = r; });

      expect(result).toBe(false);
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
