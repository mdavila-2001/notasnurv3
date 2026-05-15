import { AttendanceStatus } from "./attendance-status.type";

export interface AttendanceRowUi {
    enrollmentId: string;
    studentName: string;
    ci: string;
    degreeName?: string;
    status: AttendanceStatus;
}
