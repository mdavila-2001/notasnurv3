import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AttendanceTab } from './attendance-tab';
import { AttendanceService } from '../../../../services/attendance.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { of } from 'rxjs';

describe('AttendanceAlert Integration', () => {
  let fixture: ComponentFixture<AttendanceTab>;
  let component: AttendanceTab;
  let service: AttendanceService;
  let operationalService: SubjectOperationalService;
  let toast: ToastService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const mockStudents = [
    { enrollmentId: 'enroll-1', studentId: 'stu-1', fullName: 'Carlos Gómez', ci: '1234567', degreeName: 'Ingeniería' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceTab],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AttendanceService,
        SubjectOperationalService,
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn()
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => '12'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceTab);
    component = fixture.componentInstance;
    service = TestBed.inject(AttendanceService);
    operationalService = TestBed.inject(SubjectOperationalService);
    toast = TestBed.inject(ToastService);
    httpMock = TestBed.inject(HttpTestingController);

    operationalService.setStudentsDirectly(mockStudents as any);
    operationalService.setSubjectDirectly({ id: 12, name: 'Álgebra Lineal' } as any);
    
    service.resetModule();
  });

  afterEach(() => {
    httpMock.verify();
    service.resetModule();
    operationalService.clearStore();
    TestBed.resetTestingModule();
  });

  it('should load initial absences, trigger absence alerts at 5, and submit bulk attendance', () => {
    fixture.detectChanges();

    const absencesReq = httpMock.expectOne(`${baseUrl}/attendance/subject/12/absences`);
    expect(absencesReq.request.method).toBe('GET');
    absencesReq.flush({
      success: true,
      data: [
        { enrollmentId: 'enroll-1', absencesCount: 4 }
      ]
    });

    const dateReq = httpMock.expectOne(`${baseUrl}/attendance/subject/12?date=${service.date()}`);
    expect(dateReq.request.method).toBe('GET');
    dateReq.flush({ success: true, data: [] });

    fixture.detectChanges();

    let rows = component.attendanceRows();
    expect(rows.length).toBe(1);
    expect(rows[0].absencesCount).toBe(4);
    expect(rows[0].status).toBe('PRESENT');
    expect(component.absenceBadgeColor(rows[0].absencesCount)).toBe('warning');
    expect(component.rowTone(rows[0].absencesCount)).toBe('attendance-row--warning');

    component.handleStatusChange('enroll-1', 'ABSENT');
    fixture.detectChanges();

    expect(component.recordCounts().absent).toBe(1);
    expect(component.recordCounts().present).toBe(0);

    expect(component.isReady()).toBe(true);
    component.handleSubmit();

    const submitReq = httpMock.expectOne(`${baseUrl}/attendance/bulk`);
    expect(submitReq.request.method).toBe('POST');
    expect(submitReq.request.body).toEqual({
      subjectId: 12,
      date: service.date(),
      records: [
        { enrollmentId: 'enroll-1', status: 'ABSENT' }
      ]
    });

    submitReq.flush({ success: true });
    
    const reloadReq = httpMock.expectOne(`${baseUrl}/attendance/subject/12?date=${service.date()}`);
    reloadReq.flush({
      success: true,
      data: [
        { enrollmentId: 'enroll-1', status: 'ABSENT' }
      ]
    });

    fixture.detectChanges();

    expect(component.attendanceRows()[0].status).toBe('ABSENT');
    expect(toast.success).toHaveBeenCalledWith('La asistencia se guardó correctamente.', '¡Asistencia guardada!');
  });
});
