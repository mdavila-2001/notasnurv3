import { Component, OnInit, computed, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AttendanceService } from '../../../../services/attendance.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { AttendanceRowUi, AttendanceStatus } from '../../../../../../core/models/attendance';
import { Button } from '../../../../../../shared/components/button/button';
import { Input } from '../../../../../../shared/components/input/input';
import { Loader } from '../../../../../../shared/components/loader/loader';
import { Badge } from '../../../../../../shared/components/badge/badge';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-attendance-tab',
  standalone: true,
  imports: [
    Button,
    Input,
    Loader,
    Badge,
  ],
  templateUrl: './attendance-tab.html',
  styleUrl: './attendance-tab.css'
})
export class AttendanceTab implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private contextLoaded = false;
  private hasInitializedDraft = false;

  readonly isLoading = this.operationalService.isLoading;
  readonly attendanceDraft = this.attendanceService.attendanceDraft;
  readonly subject = this.operationalService.subject;
  readonly isReady = this.attendanceService.isReadyToSubmit;
  readonly students = this.operationalService.students;
  readonly isBusy = computed(() => this.operationalService.isLoading() || this.attendanceService.isDraftHydrating());
  readonly tableColumns = [
    { key: 'student', label: 'Estudiante' },
    { key: 'absences', label: 'Faltas' },
    { key: 'attendance', label: 'Estado' },
  ];

  readonly attendanceRows = computed(() => {
    const draftByEnrollmentId = new Map(
      this.attendanceDraft().map((row) => [row.enrollmentId, row] as const),
    );

    return this.students().map((student) => {
      const enrollmentId = student.enrollmentId?.trim() || student.studentId || '';
      const draftRow = draftByEnrollmentId.get(enrollmentId);

      return {
        id: enrollmentId,
        enrollmentId,
        studentName: student.fullName,
        ci: student.ci ?? 'N/A',
        degreeName: student.degreeName,
        photoUrl: student.photoUrl,
        absencesCount: draftRow?.absencesCount ?? 0,
        totalAbsences: draftRow?.totalAbsences ?? 0,
        status: draftRow?.status ?? 'PRESENT',
      } satisfies AttendanceRowUi;
    });
  });

  readonly date = this.attendanceService.date;
  readonly isSaving = this.attendanceService.isSaving;
  readonly recordCounts = this.attendanceService.recordCounts;
  readonly error = this.attendanceService.error;
  readonly successMessage = this.attendanceService.successMessage;

  constructor() {
    effect(() => {
      const students = this.operationalService.students();
      if (students.length > 0) {
        untracked(() => {
          if (!this.hasInitializedDraft && this.attendanceService.attendanceDraft().length === 0) {
            this.hasInitializedDraft = true;
            const subjectId = this.getSubjectId();
            this.attendanceService.initializeDraft(students, subjectId);
          }
        });
      }
    });
  }

  ngOnInit(): void {
  }

  private getSubjectId(): string | null {
    let id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    
    if (!id) {
      const parts = window.location.pathname.split('/');
      const idx = parts.findIndex(p => p === 'subject' || p === 'subjects');
      if (idx !== -1 && parts.length > idx + 1) {
        id = parts[idx + 1];
      }
    }
    
    return id || null;
  }

  handleDateChange(value: string | number): void {
    this.attendanceService.setDate(String(value));
  }

  handleStatusChange(enrollmentId: string, status: AttendanceStatus): void {
    this.attendanceService.updateStudentStatus(enrollmentId, status);
  }



  handleSubmit(): void {
    const subjectId = this.operationalService.currentSubjectId() || this.getSubjectId();

    if (!subjectId) {
      this.toast.error('No se pudo determinar la materia.', 'Error');
      return;
    }

    this.attendanceService.submit(subjectId).subscribe({
      next: (_success) => {
        this.toast.success('La asistencia se guardó correctamente.', '¡Asistencia guardada!');
        this.attendanceService.setDate(this.attendanceService.date());
      },
      error: (err: Error) => {
        console.error('[AttendanceTab] Error al guardar:', err.message);
        this.toast.error(err.message, 'Error al guardar');
      }
    });
  }


  absenceBadgeColor(absences: number): 'success' | 'warning' | 'danger' | 'neutral' {
    if (absences <= 0) return 'success';
    if (absences >= 5) return 'danger';
    return 'warning';
  }

  absenceLabel(absences: number): string {
    return absences === 1 ? '1 Falta' : `${absences} Faltas`;
  }

  statusVariant(status: AttendanceStatus, selected: AttendanceStatus): 'primary' | 'secondary' | 'tertiary' | 'present' | 'absent' | 'justified' {
    if (status !== selected) return 'tertiary';
    if (selected === 'ABSENT') return 'absent';
    if (selected === 'JUSTIFIED') return 'justified';
    return 'present';
  }

  statusClass(status: AttendanceStatus, selected: AttendanceStatus): string {
    return status === selected ? 'attendance-chip attendance-chip--active' : 'attendance-chip';
  }

  rowTone(absences: number): string {
    if (absences <= 0) return 'attendance-row--success';
    if (absences >= 5) return 'attendance-row--danger';
    return 'attendance-row--warning';
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  private decorateRow(row: AttendanceRowUi): AttendanceRowUi {
    return {
      ...row,
      totalAbsences: row.status === 'ABSENT' ? row.totalAbsences + 1 : row.totalAbsences,
    };
  }
}