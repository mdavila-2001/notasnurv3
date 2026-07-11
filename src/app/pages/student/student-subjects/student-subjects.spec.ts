import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { StudentSubjectsComponent } from './student-subjects';
import { EnrollmentApiService } from '../../../features/teacher/services/enrollment-api.service';

describe('StudentSubjectsComponent', () => {
  let component: StudentSubjectsComponent;
  let fixture: ComponentFixture<StudentSubjectsComponent>;
  let mockEnrollmentApiService: any;

  const mockSubjectsResponse = {
    data: [
      {
        subjectCode: 'INF-111',
        subjectName: 'Introducción a la Informática',
        teacherName: 'Docente Uno',
        degreeName: 'Ingeniería de Sistemas',
      },
      {
        subjectCode: 'INF-112',
        subjectName: 'Cálculo I',
        teacherName: 'Docente Dos',
        degreeName: '',
      },
    ],
  };

  beforeEach(async () => {
    mockEnrollmentApiService = {
      getMySubjects: vi.fn(),
    };
    mockEnrollmentApiService.getMySubjects.mockReturnValue(of(mockSubjectsResponse));

    await TestBed.configureTestingModule({
      imports: [StudentSubjectsComponent, HttpClientTestingModule],
      providers: [
        { provide: EnrollmentApiService, useValue: mockEnrollmentApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSubjectsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load user subjects on init', () => {
    fixture.detectChanges();
    expect(mockEnrollmentApiService.getMySubjects).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.mySubjects().length).toBe(2);
    expect(component.mySubjects()[0].subjectCode).toBe('INF-111');
    expect(component.errorMessage()).toBe('');
  });

  it('should display loading state while loading subjects', () => {
    const subjects$ = new Subject<any>();
    mockEnrollmentApiService.getMySubjects.mockReturnValue(subjects$);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Cargando tus materias...');

    subjects$.next(mockSubjectsResponse);
    subjects$.complete();
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(compiled.querySelector('.loading-state')).toBeFalsy();
    expect(compiled.querySelector('.subjects-grid')).toBeTruthy();
  });

  it('should display empty state when user has no subjects', () => {
    mockEnrollmentApiService.getMySubjects.mockReturnValue(of({ data: [] }));
    fixture.detectChanges();

    expect(component.mySubjects().length).toBe(0);
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('No tienes materias matriculadas');
  });

  it('should display error state when request fails', () => {
    mockEnrollmentApiService.getMySubjects.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Error al cargar tus materias matriculadas.');
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.error-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Error al cargar tus materias matriculadas.');
  });

  it('should retry loading subjects on retry click', () => {
    mockEnrollmentApiService.getMySubjects.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.error-state')).toBeTruthy();

    mockEnrollmentApiService.getMySubjects.mockReturnValue(of(mockSubjectsResponse));

    const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();

    expect(mockEnrollmentApiService.getMySubjects).toHaveBeenCalledTimes(2);
    expect(component.isLoading()).toBe(false);
    expect(component.mySubjects().length).toBe(2);
    expect(compiled.querySelector('.error-state')).toBeFalsy();
    expect(compiled.querySelector('.subjects-grid')).toBeTruthy();
  });
});
