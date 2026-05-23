export interface AttendanceAbsenceRecord {
  enrollmentId: string | number | null;
  absences?: number;
  totalAbsences?: number;
}