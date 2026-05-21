export interface AcademicSettings {
  minPassingGrade: number;
  roundingType: 'CLASSIC_UP' | 'TRUNCATE' | 'ONE_DECIMAL';
  globalGradesDeadline: string;
}

export interface AttendanceSettings {
  maxAbsencesPresencial: number;
  maxAbsencesSemiPresencial: number;
}

export interface InstitutionalSettings {
  pdfTemplateHeaderType: 'NUR_CLASSIC' | 'NUR_MODERN';
  allowLateGradesEntry: boolean;
}

export interface StudentSubscriptionSettings {
  emailAlertOnRisk: boolean;
}

export interface GlobalSettingsResponse {
  academic: AcademicSettings;
  attendance: AttendanceSettings;
  institutional: InstitutionalSettings;
}
