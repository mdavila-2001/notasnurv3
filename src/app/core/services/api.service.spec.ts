import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.models';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const mockResponse: ApiResponse<{ id: string }> = {
    success: true,
    message: 'OK',
    data: { id: '1' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should call GET with endpoint', () => {
      service.get<{ id: string }>('/users').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append query params', () => {
      service.get('/users', { page: 0, size: 10 }).subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/users' && r.params.has('page'));
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(mockResponse);
    });

    it('should skip null/undefined params', () => {
      service.get('/users', { page: 0, name: null, email: undefined }).subscribe();

      const req = httpMock.expectOne(r => r.url === '/api/users');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.has('name')).toBeFalse();
      expect(req.request.params.has('email')).toBeFalse();
      req.flush(mockResponse);
    });
  });

  describe('post', () => {
    it('should call POST with body', () => {
      const body = { name: 'test' };
      service.post('/users', body).subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('put', () => {
    it('should call PUT with body', () => {
      const body = { name: 'updated' };
      service.put('/users/1', body).subscribe();

      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('patch', () => {
    it('should call PATCH with body', () => {
      const body = { status: 'INACTIVE' };
      service.patch('/users/1/status', body).subscribe();

      const req = httpMock.expectOne('/api/users/1/status');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should call DELETE', () => {
      service.delete('/users/1').subscribe();

      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('downloadBlob', () => {
    it('should return Blob with GET responseType blob', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      service.downloadBlob('/reports/subjects/1/acta-notas/pdf').subscribe(b => {
        expect(b.size).toBe(4);
      });

      const req = httpMock.expectOne('/api/reports/subjects/1/acta-notas/pdf');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });
  });

  describe('baseUrl', () => {
    it('should prefix /api to all endpoints', () => {
      service.get('/test').subscribe();
      httpMock.expectOne('/api/test').flush(mockResponse);
    });
  });
});
