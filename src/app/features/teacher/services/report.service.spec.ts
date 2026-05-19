import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
    service.reset();

    // Stub URL.createObjectURL and document.createElement for download tests
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');
  });

  afterEach(() => {
    httpMock.verify();
    service.reset();
  });

  describe('reportOptions', () => {
    it('should provide two report options', () => {
      expect(service.reportOptions.length).toBe(2);
    });

    it('should have correct acta-pdf config', () => {
      const pdf = service.reportOptions.find(r => r.type === 'acta-pdf');
      expect(pdf?.label).toContain('PDF');
      expect(pdf?.endpoint('99')).toBe('/reports/subjects/99/acta-notas/pdf');
      expect(pdf?.filename('99')).toBe('Acta_Notas_99.pdf');
    });

    it('should have correct asistencia-excel config', () => {
      const excel = service.reportOptions.find(r => r.type === 'asistencia-excel');
      expect(excel?.label).toContain('Excel');
      expect(excel?.endpoint('99')).toBe('/reports/subjects/99/asistencia/excel');
      expect(excel?.filename('99')).toBe('Asistencias_99.xlsx');
    });
  });

  describe('download', () => {
    it('should download PDF and trigger browser download', () => {
      let result = false;
      service.download('99', 'acta-pdf').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/reports/subjects/99/acta-notas/pdf');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['%PDF'], { type: 'application/pdf' }));

      expect(result).toBeTrue();
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(service.lastSuccess()).toContain('PDF');
      expect(service.isDownloading()).toBeNull();
    });

    it('should download Excel and trigger browser download', () => {
      service.download('99', 'asistencia-excel').subscribe();

      const req = httpMock.expectOne('/api/reports/subjects/99/asistencia/excel');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['EXCEL'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

      expect(service.lastSuccess()).toContain('Excel');
    });

    it('should handle download failure', () => {
      let result = true;
      service.download('99', 'acta-pdf').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/reports/subjects/99/acta-notas/pdf');
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(result).toBeFalse();
      expect(service.error()).toBeTruthy();
      expect(service.isDownloading()).toBeNull();
    });

    it('should set isDownloading during request', () => {
      service.download('99', 'acta-pdf').subscribe();
      expect(service.isDownloading()).toBe('acta-pdf');

      httpMock.expectOne('/api/reports/subjects/99/acta-notas/pdf').flush(new Blob());
      expect(service.isDownloading()).toBeNull();
    });

    it('should return false for invalid report type', () => {
      let result = true;
      (service as any).download('99', 'invalid-type').subscribe((r: boolean) => { result = r; });
      expect(result).toBeFalse();
    });
  });
});
