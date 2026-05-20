import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ApiResponse } from '../../../core/models/api.models';
import { GradeBulkRequest, GradeResponse } from '../../../core/models/grade.models';
import { ApiService } from '../../../core/services/api.service';
import { GradeApiService } from './grade-api.service';

class MockApiService {
  lastGetEndpoint: string | null = null;
  lastPostEndpoint: string | null = null;
  lastPostBody: unknown = null;

  getResponse: Observable<ApiResponse<GradeResponse[]>> = of({
    success: true,
    message: '',
    data: [],
  });

  postResponse: Observable<ApiResponse<void>> = of({
    success: true,
    message: '',
    data: undefined,
  });

  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    this.lastGetEndpoint = endpoint;
    return this.getResponse as Observable<ApiResponse<T>>;
  }

  post<T>(endpoint: string, body: unknown): Observable<ApiResponse<T>> {
    this.lastPostEndpoint = endpoint;
    this.lastPostBody = body;
    return this.postResponse as Observable<ApiResponse<T>>;
  }
}

describe('GradeApiService', () => {
  let service: GradeApiService;
  let apiMock: MockApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GradeApiService,
        { provide: ApiService, useClass: MockApiService },
      ],
    });

    service = TestBed.inject(GradeApiService);
    apiMock = TestBed.inject(ApiService) as unknown as MockApiService;
  });

  it('normalizes enrollmentId values from getGradesBySubject', () => {
    apiMock.getResponse = of({
      success: true,
      message: '',
      data: [
        { id: 1, enrollmentId: 77, componentId: 1, score: 85 },
        { id: 2, enrollmentId: '88-A', componentId: 2, score: 90 },
        { id: 3, enrollmentId: null, componentId: 3, score: 60 },
      ],
    });

    let result: GradeResponse[] = [];
    service.getGradesBySubject('SUB-1').subscribe((grades) => {
      result = grades;
    });

    expect(apiMock.lastGetEndpoint).toBe('/grades/subject/SUB-1');
    expect(result.map((grade) => grade.enrollmentId)).toEqual(['77', '88-A', '']);
  });

  it('sends bulk payload to save endpoint', () => {
    const payload: GradeBulkRequest = {
      grades: [
        { enrollmentId: 'ENR-10', componentId: 5, score: 95 },
      ],
    };

    let emittedValue: void | undefined = undefined;
    service.saveGrades(payload).subscribe((value) => {
      emittedValue = value;
    });

    expect(apiMock.lastPostEndpoint).toBe('/grades/save');
    expect(apiMock.lastPostBody).toEqual(payload);
    expect(emittedValue).toBeUndefined();
  });

  it('propagates API errors from getGradesBySubject', () => {
    apiMock.getResponse = throwError(() => new Error('network-error'));

    let errorMessage = '';
    service.getGradesBySubject('SUB-ERR').subscribe({
      next: () => {
        throw new Error('Expected error path');
      },
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    expect(errorMessage).toBe('network-error');
  });
});
