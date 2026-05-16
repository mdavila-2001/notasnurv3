import { AttendanceStatus } from './attendance-status.type';

export interface StudentAttendanceRecord {
    enrollmentId: string;
    status: AttendanceStatus;
}