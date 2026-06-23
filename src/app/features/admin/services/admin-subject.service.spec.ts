import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminSubjectService } from './admin-subject.service';
import { ApiService } from '../../../core/services/api.service';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { SubjectResponse, SubjectCreateUpdateRequest } from '../../../core/models/subject.model';

describe('AdminSubjectService', () => {
  let service: AdminSubjectService;
  let httpMock: HttpTestingController;

  const mockSubject: SubjectResponse = {
    id: 'subj-123',
    code: 'INF-320',
    name: 'Mobile Programming II',
    modality: 'FACE_TO_FACE',
    capacity: 40,
    semesterId: '1',
    teacherId: 'teacher-456',
    teacherName: 'Orlando Almagro',
    semesterName: '1-2026',
    recordStatus: 'ACTIVE',
    management: '2026'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminSubjectService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminSubjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should handle raw array responses', () => {
      const mockRawArray = [mockSubject];
      service.getAll().subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data).toEqual(mockRawArray);
        expect(res.message).toBe('Catálogo obtenido');
      });

      const req = httpMock.expectOne('/api/subjects');
      expect(req.request.method).toBe('GET');
      req.flush(mockRawArray);
    });

    it('should handle standard ApiResponse responses', () => {
      const mockResponse = { success: true, message: 'Custom msg', data: [mockSubject] };
      service.getAll().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/subjects');
      req.flush(mockResponse);
    });
  });

  it('should get paginated subjects', () => {
    const mockResponse = { success: true, message: 'Ok', data: [mockSubject] };
    service.getPaginated(0, 5, 'code,desc').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/subjects/paginated' && r.params.has('page'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.get('sort')).toBe('code,desc');
    req.flush(mockResponse);
  });

  it('should get a subject by id', () => {
    const mockResponse = { success: true, message: 'Ok', data: mockSubject };
    service.getById('subj-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/subjects/subj-123');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a subject', () => {
    const payload: SubjectCreateUpdateRequest = {
      code: 'INF-320',
      name: 'Mobile Programming II',
      modality: 'FACE_TO_FACE',
      capacity: 40,
      teacherId: 'teacher-456',
      semesterId: '1'
    };
    const mockResponse = { success: true, message: 'Ok', data: mockSubject };

    service.create(payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/subjects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should update a subject', () => {
    const payload: Partial<SubjectCreateUpdateRequest> = {
      name: 'Updated Subject Title'
    };
    const mockResponse = { success: true, message: 'Ok', data: mockSubject };

    service.update('subj-123', payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/subjects/subj-123');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should delete a subject', () => {
    const mockResponse = { success: true, message: 'Ok', data: null as any };
    service.delete('subj-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/subjects/subj-123');
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should activate a subject', () => {
    const mockResponse = { success: true, message: 'Activated', data: mockSubject };
    service.activate('subj-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/subjects/subj-123/activate');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('should close a subject', () => {
    const mockResponse = { success: true, message: 'Closed', data: mockSubject };
    service.close('subj-123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/subjects/subj-123/close');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });
});
