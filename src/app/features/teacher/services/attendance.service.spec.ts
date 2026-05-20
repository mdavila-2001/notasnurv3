import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AttendanceService } from './attendance.service';
import { StudentEnrolledResponse } from './enrollment-api.service';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;
  let operationalService: SubjectOperationalService;

  const mockStudents: StudentEnrolledResponse[] = [
    { id: 'stu-1', studentId: 'stu-1', fullName: 'Alice', ci: '123', email: 'a@t.com', degreeName: 'Ing.' },
    { id: 'stu-2', studentId: 'stu-2', fullName: 'Bob', ci: '456', email: 'b@t.com', degreeName: 'Lic.' },
    { id: 'stu-3', studentId: 'stu-3', fullName: 'Charlie', ci: '789', email: 'c@t.com', degreeName: 'Med.' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        SubjectOperationalService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
    operationalService = TestBed.inject(SubjectOperationalService);
    service.resetModule();
  });

  afterEach(() => {
    httpMock.verify();
    service.resetModule();
  });

  describe('initializeDraft', () => {
    it('should load students and set default statuses', () => {
      operationalService['_students'].set(mockStudents as any);
      service.initializeDraft();

      expect(service.attendanceDraft().length).toBe(3);
      expect(service.isReadyToSubmit()).toBe(false); // Subject context not loaded yet

      const records = service.attendanceDraft();
      expect(records[0].status).toBe('PRESENT');
      expect(records[1].status).toBe('PRESENT');
    });
  });

  describe('updateStudentStatus', () => {
    beforeEach(() => {
      operationalService['_students'].set(mockStudents as any);
      service.initializeDraft();
    });

    it('should update status for a student', () => {
      service.updateStudentStatus('stu-1', 'ABSENT');
      const record = service.attendanceDraft().find(r => r.enrollmentId === 'stu-1');
      expect(record?.status).toBe('ABSENT');
    });

    it('should update record counts', () => {
      service.updateStudentStatus('stu-1', 'ABSENT');
      service.updateStudentStatus('stu-2', 'LATE');
      const counts = service.recordCounts();
      expect(counts.present).toBe(1);
      expect(counts.absent).toBe(1);
      expect(counts.late).toBe(1);
      expect(counts.total).toBe(3);
    });
  });

  describe('setDate', () => {
    it('should update date', () => {
      service.setDate('2026-06-01');
      expect(service.date()).toBe('2026-06-01');
    });
  });

  describe('submit', () => {
    beforeEach(() => {
      operationalService.setSubjectDirectly({ id: 10, recordStatus: 'OPEN' } as any);
      operationalService['_students'].set(mockStudents as any);
      service.initializeDraft();
    });

    it('should POST bulk attendance and return success', () => {
      service.setDate('2026-05-12');
      service.updateStudentStatus('stu-1', 'ABSENT');

      let result = false;
      service.submit().subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/attendance/bulk');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        subjectId: 10,
        date: '2026-05-12',
        records: [
          { enrollmentId: 'stu-1', status: 'ABSENT' },
          { enrollmentId: 'stu-2', status: 'PRESENT' },
          { enrollmentId: 'stu-3', status: 'PRESENT' },
        ],
      });
      req.flush({ success: true, message: 'Asistencia registrada', data: null });

      expect(result).toBe(true);
      expect(service.successMessage()).toBeTruthy();
      expect(service.isSaving()).toBe(false);
    });

    it('should handle server error', () => {
      service.setDate('2026-05-12');

      let result = true;
      service.submit().subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/attendance/bulk');
      req.flush(
        { success: false, message: 'No permite fechas futuras', data: null },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(result).toBe(false);
      expect(service.error()).toBeTruthy();
    });

    it('should not submit if no subject or students loaded', () => {
      service.resetModule();
      let result = true;
      service.submit().subscribe(r => { result = r; });
      expect(result).toBe(false);
    });
  });
});
