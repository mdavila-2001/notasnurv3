import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../../services/attendance.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { AttendanceStatus } from '../../../../../../core/models/attendance';
import { Button } from '../../../../../../shared/components/button/button';

@Component({
  selector: 'app-attendance-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './attendance-tab.html',
  styleUrl: './attendance-tab.css'
})
export class AttendanceTab implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly operationalService = inject(SubjectOperationalService);

  readonly isLoading = this.operationalService.isLoading;
  readonly attendanceDraft = this.attendanceService.attendanceDraft;
  readonly isReady = this.attendanceService.isReadyToSubmit;

  readonly date = this.attendanceService.date;
  readonly isSaving = this.attendanceService.isSaving;
  readonly recordCounts = this.attendanceService.recordCounts;
  readonly error = this.attendanceService.error;
  readonly successMessage = this.attendanceService.successMessage;

  ngOnInit(): void {
    this.attendanceService.initializeDraft();
  }

  handleDateChange(date: string): void {
    this.attendanceService.setDate(date);
  }

  handleStatusChange(enrollmentId: string, status: AttendanceStatus): void {
    this.attendanceService.updateStudentStatus(enrollmentId, status);
  }

  setAll(status: AttendanceStatus): void {
    this.attendanceService.markAllAs(status);
  }

  handleSubmit(): void {
    this.attendanceService.submit().subscribe();
  }
}