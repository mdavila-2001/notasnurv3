import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSubjectService, SubjectResponse } from '../../services/admin-subject.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Loader } from '../../../../shared/components/loader/loader';
import { Button } from '../../../../shared/components/button/button';
import { Modal } from '../../../../shared/components/modal/modal';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, Loader, Button, Modal],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
})
export class AdminReports implements OnInit {
  private readonly adminSubjectService = inject(AdminSubjectService);
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly subjects = signal<SubjectResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isDownloading = signal<string | null>(null); // Guardará 'type-id' por ej. 'pdf-1'
  readonly isClosingSubject = signal<string | null>(null);

  // Filtros
  readonly searchFilter = signal('');
  readonly statusFilter = signal('ALL'); // ALL, DRAFT, ACTIVE, CLOSED

  // Control del modal de cierre
  readonly isCloseModalOpen = signal(false);
  readonly selectedSubject = signal<SubjectResponse | null>(null);

  readonly filteredSubjects = computed(() => {
    const list = this.subjects();
    const query = this.searchFilter().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((sub) => {
      const matchesSearch =
        sub.name.toLowerCase().includes(query) ||
        sub.code.toLowerCase().includes(query) ||
        (sub.teacherName && sub.teacherName.toLowerCase().includes(query));

      const matchesStatus = status === 'ALL' || sub.recordStatus === status;

      return matchesSearch && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading.set(true);
    this.adminSubjectService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.subjects.set(res.data ?? []);
        },
        error: () => {
          this.toast.error('No se pudo cargar el listado de materias.', 'Error de carga');
        },
      });
  }

  downloadPdf(subject: SubjectResponse): void {
    const key = `pdf-${subject.id}`;
    this.isDownloading.set(key);

    const url = `/reports/subjects/${subject.id}/grades-report/pdf`;
    const mime = 'application/pdf';
    const filename = `grades-report-subject-${subject.id}.pdf`;

    this.apiService
      .downloadBlob(url, mime)
      .pipe(finalize(() => this.isDownloading.set(null)))
      .subscribe({
        next: (blob) => {
          this.triggerFileDownload(blob, filename, mime);
          this.toast.success('Acta PDF descargada correctamente.', 'Reporte PDF');
        },
        error: () => {
          this.toast.error('No se pudo descargar el acta en PDF.', 'Error PDF');
        },
      });
  }

  downloadExcel(subject: SubjectResponse): void {
    const key = `excel-${subject.id}`;
    this.isDownloading.set(key);

    const url = `/reports/subjects/${subject.id}/attendance/excel`;
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `attendance-report-subject-${subject.id}.xlsx`;

    this.apiService
      .downloadBlob(url, mime)
      .pipe(finalize(() => this.isDownloading.set(null)))
      .subscribe({
        next: (blob) => {
          this.triggerFileDownload(blob, filename, mime);
          this.toast.success('Reporte de asistencias descargado correctamente.', 'Reporte Excel');
        },
        error: () => {
          this.toast.error('No se pudo descargar el reporte en Excel.', 'Error Excel');
        },
      });
  }

  openCloseModal(subject: SubjectResponse): void {
    if (subject.recordStatus === 'CLOSED' || this.isClosingSubject() !== null) {
      return;
    }
    this.selectedSubject.set(subject);
    this.isCloseModalOpen.set(true);
  }

  closeCloseModal(): void {
    if (this.isClosingSubject() !== null) {
      return;
    }
    this.isCloseModalOpen.set(false);
    this.selectedSubject.set(null);
  }

  confirmCloseSubject(): void {
    const subject = this.selectedSubject();
    if (!subject) return;

    this.isClosingSubject.set(subject.id);
    this.adminSubjectService
      .close(String(subject.id))
      .pipe(
        finalize(() => {
          this.isClosingSubject.set(null);
        })
      )
      .subscribe({
        next: (res) => {
          this.toast.success(
            `La materia "${subject.name}" ha sido cerrada de forma definitiva.`,
            'Materia Cerrada'
          );
          // Actualizar el estado localmente
          this.subjects.update((list) =>
            list.map((s) =>
              s.id === subject.id ? { ...s, recordStatus: 'CLOSED' } : s
            )
          );
          this.isClosingSubject.set(null);
          this.closeCloseModal();
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'No se pudo cerrar la materia.';
          this.toast.error(errMsg, 'Error al cerrar');
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
