import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SubjectService } from './subject.service';
import { environment } from '../../../../environments/environment';
import { Subject, SubjectRequest } from '../../models/subject.model';

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
      {
        id: 1,
        code: 'CS101',
        name: 'Intro to Programming',
        teacherId: 'teacher-1',
        teacherName: 'Fernando',
        capacity: 30,
        semesterId: 1,
        semesterName: '2024-I',
        management: '2024',
        modality: 'FACE_TO_FACE',
        recordStatus: 'PUBLISHED'
      },
    ];

    service.getSubjects().subscribe((subjects) => {
      expect(subjects).toEqual(mockSubjects);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSubjects);
  });

  it('should create a subject', () => {
    // CORREGIDO: Tipado estricto con SubjectRequest y modalidad correcta
    const payload: SubjectRequest = { 
      code: 'CS102', 
      name: 'Data Structures', 
      modality: 'FACE_TO_FACE', 
      capacity: 25,
      semesterId: 1,
      teacherId: 'teacher-1'
    };

    const mockSubject: Subject = { 
      id: 2, 
      code: payload.code,
      name: payload.name,
      teacherId: payload.teacherId,
      teacherName: 'Fernando',
      capacity: payload.capacity,
      semesterId: payload.semesterId, 
      semesterName: '2024-I',
      management: '2024',
      modality: payload.modality, 
      recordStatus: 'PUBLISHED'
    };

    service.createSubject(payload).subscribe((subject) => {
      expect(subject).toEqual(mockSubject);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockSubject);
  });
});
