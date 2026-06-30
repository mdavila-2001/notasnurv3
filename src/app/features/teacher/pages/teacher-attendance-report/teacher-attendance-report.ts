import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Loader } from '../../../../shared/components/loader/loader';
import { Button } from '../../../../shared/components/button/button';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, Loader, Button],
  templateUrl: './teacher-attendance-report.html',
  styleUrl: './teacher-attendance-report.css',
})
export class TeacherAttendanceReport implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly subjects = signal<SubjectResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isDownloading = signal<string | null>(null);
  readonly searchFilter = signal('');

  readonly filteredSubjects = computed(() => {
    const list = this.subjects();
    const query = this.searchFilter().toLowerCase().trim();

    if (!query) return list;

    return list.filter((sub) =>
      sub.name.toLowerCase().includes(query) ||
      sub.code.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading.set(true);
    this.teacherService
      .getMySubjects()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.subjects.set(data || []);
        },
        error: () => {
          this.toast.error('No se pudo cargar el listado de materias asignadas.', 'Error');
        },
      });
  }

  downloadExcel(subject: SubjectResponse): void {
    this.isDownloading.set(subject.id);

    const url = `/reports/subjects/${subject.id}/attendance/excel`;
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `attendance-report-subject-${subject.id}.xlsx`;

    this.apiService
      .downloadBlob(url, mime)
      .pipe(finalize(() => this.isDownloading.set(null)))
      .subscribe({
        next: (blob) => {
          this.triggerFileDownload(blob, filename, mime);
          this.toast.success(`Reporte de asistencias para ${subject.code} descargado.`, 'Descarga Exitosa');
        },
        error: () => {
          this.toast.error('No se pudo descargar el reporte en Excel.', 'Error');
        },
      });
  }

  private triggerFileDownload(blob: Blob, filename: string, mimeType: string): void {
    const file = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
    const url = window.URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
