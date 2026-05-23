import { AttendanceStatus } from "./attendance-status.type";

export interface AttendanceRowUi {
    id: string;
    enrollmentId: string;
    studentName: string;
    ci: string;
    degreeName?: string;
    photoUrl?: string;
    absencesCount?: number;
    totalAbsences: number;
    status: AttendanceStatus;
}
