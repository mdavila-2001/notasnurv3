import { AttendanceStatus } from "./attendance-status.type";

export interface AttendanceRowUi {
    enrollmentId: string;
    studentName: string;
    ci: string;
    status: AttendanceStatus;
}
