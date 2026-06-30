import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminAuditService } from './admin-audit.service';
import { ApiService } from '../../../core/services/api.service';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AdminAuditService', () => {
  let service: AdminAuditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminAuditService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminAuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch audit logs with default pagination params', () => {
    const mockResponse = { success: true, message: 'Ok', data: { content: [], totalPages: 0, totalElements: 0, size: 20, number: 0 } };
    service.getAuditLogs({ page: 0, size: 20 }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/audit-logs' && r.params.has('page'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockResponse);
  });

  it('should include filter params when provided', () => {
    const mockResponse = { success: true, message: 'Ok', data: { content: [], totalPages: 0, totalElements: 0, size: 20, number: 0 } };
    service.getAuditLogs({ page: 0, size: 20, action: 'UPDATE', affectedTable: 'grade', search: 'Juan' }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/audit-logs' && r.params.has('action'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('action')).toBe('UPDATE');
    expect(req.request.params.get('affectedTable')).toBe('grade');
    expect(req.request.params.get('search')).toBe('Juan');
    req.flush(mockResponse);
  });
});
