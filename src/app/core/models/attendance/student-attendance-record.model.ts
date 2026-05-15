import { AttendanceStatus } from './attendance-status.type';

export interface StudentAttendanceRecord {
    enrollmentId: string;
    fullName: string;
    ci: string;
    email: string;
    degreeName: string;
    status: AttendanceStatus;
}
