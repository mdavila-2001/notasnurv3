import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SubjectService } from './subject.service';
import { environment } from '../../../../environments/environment';
import { Subject } from '../../models/subject.model';

describe('SubjectService', () => {
  let service: SubjectService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/subjects`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubjectService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SubjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch subjects', () => {
    const mockSubjects: Subject[] = [
      { id: '1', code: 'CS101', name: 'Intro to Programming', description: 'Basics' },
    ];

    service.getSubjects().subscribe((subjects) => {
      expect(subjects).toEqual(mockSubjects);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSubjects);
  });

  it('should create a subject', () => {
    const payload = { code: 'CS102', name: 'Data Structures', description: 'Advanced' };
    const mockSubject: Subject = { id: '2', ...payload };

    service.createSubject(payload).subscribe((subject) => {
      expect(subject).toEqual(mockSubject);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockSubject);
  });
});
