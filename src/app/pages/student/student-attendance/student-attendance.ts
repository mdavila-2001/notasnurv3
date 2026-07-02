import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { Loader } from '../../../shared/components/loader/loader';
import { Button } from '../../../shared/components/button/button';
import { Table, TableColumn } from '../../../shared/components/table/table';

interface AttendanceTableRow {
  id: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  absences: number;
  limit: number;
  status: string;
  atRisk: boolean;
}

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, Loader, Button, Table],
  templateUrl: './student-attendance.html',
  styleUrl: './student-attendance.css',
})
export class StudentAttendance implements OnInit {
  private readonly studentPortalService = inject(StudentPortalService);

  readonly isLoading = signal<boolean>(true);
  readonly enrolledSubjects = signal<any[]>([]);
  readonly error = signal<string>('');

  readonly columns = signal<TableColumn[]>([
    { key: 'subjectCode', label: 'Código' },
    { key: 'subjectName', label: 'Materia' },
    { key: 'teacherName', label: 'Docente' },
    { key: 'absences', label: 'Faltas registradas' },
    { key: 'limit', label: 'Límite Permitido' },
    { key: 'status', label: 'Estado de Asistencia' }
  ]);

  readonly tableData = computed<AttendanceTableRow[]>(() => {
    return this.enrolledSubjects().map((sub, index) => {
      const absences = sub.absences ?? 0;
      const limit = sub.absenceLimit ?? 5;
      
      let status = 'Regular';
      if (absences >= limit) {
        status = 'Reprobado por Faltas';
      } else if (sub.atRisk || absences === limit - 1) {
        status = 'En Riesgo';
      }

      return {
        id: `attendance-row-${index}`,
        subjectCode: sub.subjectCode || '-',
        subjectName: sub.subjectName || 'Materia',
        teacherName: sub.teacherName || 'Docente',
        absences: absences,
        limit: limit,
        status: status,
        atRisk: sub.atRisk || absences === limit - 1
      };
    });
  });

  ngOnInit(): void {
    this.loadAttendanceData();
  }

  loadAttendanceData(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.studentPortalService.getStudentDashboard().subscribe({
      next: (dashboardData) => {
        this.enrolledSubjects.set(dashboardData?.enrolledSubjects ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Error al conectar con la base de datos de asistencia.');
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    if (status === 'Reprobado por Faltas') return 'badge-absences';
    if (status === 'En Riesgo') return 'badge-at-risk';
    return 'badge-approved';
  }
}
