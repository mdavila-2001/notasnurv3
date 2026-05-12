import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AttendanceService } from './attendance.service';
import { StudentEnrolledResponse } from './enrollment-api.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;

  const mockStudents: StudentEnrolledResponse[] = [
    { studentId: 'stu-1', fullName: 'Alice', ci: '123', email: 'a@t.com', degreeName: 'Ing.' },
    { studentId: 'stu-2', fullName: 'Bob', ci: '456', email: 'b@t.com', degreeName: 'Lic.' },
    { studentId: 'stu-3', fullName: 'Charlie', ci: '789', email: 'c@t.com', degreeName: 'Med.' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttendanceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
    service.reset();
  });

  afterEach(() => {
    httpMock.verify();
    service.reset();
  });

  describe('loadData', () => {
    it('should load students and set default statuses', () => {
      let completed = false;
      service.loadData('10').subscribe(() => { completed = true; });

      const req = httpMock.expectOne('/api/enrollments/subject/10');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: '', data: mockStudents });

      expect(completed).toBeTrue();
      expect(service.attendanceRecords().length).toBe(3);
      expect(service.isLoading()).toBeFalse();
      expect(service.isReady()).toBeTrue();

      const records = service.attendanceRecords();
      expect(records[0].status).toBe('PRESENT');
      expect(records[1].status).toBe('PRESENT');
    });
  });

  describe('setAttendanceStatus', () => {
    beforeEach(() => {
      service['_students'].set(mockStudents);
    });

    it('should update status for a student', () => {
      service.setAttendanceStatus('stu-1', 'ABSENT');
      const record = service.attendanceRecords().find(r => r.enrollmentId === 'stu-1');
      expect(record?.status).toBe('ABSENT');
    });

    it('should update record counts', () => {
      service.setAttendanceStatus('stu-1', 'ABSENT');
      service.setAttendanceStatus('stu-2', 'JUSTIFIED');
      const counts = service.recordCounts();
      expect(counts.present).toBe(1);
      expect(counts.absent).toBe(1);
      expect(counts.justified).toBe(1);
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
      service['_students'].set(mockStudents);
    });

    it('should POST bulk attendance and return success', () => {
      service.setDate('2026-05-12');
      service.setAttendanceStatus('stu-1', 'ABSENT');

      let result = false;
      service.submit('10').subscribe(r => { result = r; });

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

      expect(result).toBeTrue();
      expect(service.successMessage()).toBeTruthy();
      expect(service.isSaving()).toBeFalse();
    });

    it('should handle server error', () => {
      service.setDate('2026-05-12');

      let result = true;
      service.submit('10').subscribe(r => { result = r; });

      const req = httpMock.expectOne('/api/attendance/bulk');
      req.flush(
        { success: false, message: 'No permite fechas futuras', data: null },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(result).toBeFalse();
      expect(service.error()).toBeTruthy();
    });

    it('should not submit if no students loaded', () => {
      let result = true;
      service.submit('10').subscribe(r => { result = r; });
      expect(result).toBeFalse();
    });
  });
});
