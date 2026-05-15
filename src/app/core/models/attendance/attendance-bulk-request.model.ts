import { StudentAttendanceRecord } from './student-attendance-record.model';

export interface AttendanceBulkRequest {
    subjectId: number;
    date: string;
    records: StudentAttendanceRecord[];
}
