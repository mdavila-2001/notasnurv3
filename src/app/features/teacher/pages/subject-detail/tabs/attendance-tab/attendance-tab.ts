import { Component, input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceStatus } from '../../../../services/attendance.service';
import { Button } from '../../../../../../shared/components/button/button';

@Component({
  selector: 'app-attendance-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: 'attendance-tab.html',
  styleUrl: 'attendance-tab.css'
})
export class AttendanceTab implements OnInit {

  readonly service = inject(AttendanceService);

  ngOnInit() {
    this.service.loadData();
  }

  handleDateChange(date: string) {
    this.service.setDate(date);
  }

  handleStatusChange(enrollmentId: string, status: AttendanceStatus) {
    this.service.setAttendanceStatus(enrollmentId, status);
  }

  setAll(status: AttendanceStatus) {
    for (const record of this.service.attendanceRecords()) {
      this.service.setAttendanceStatus(record.enrollmentId, status);
    }
  }

  handleSubmit() {
    this.service.submit().subscribe();
  }
}
