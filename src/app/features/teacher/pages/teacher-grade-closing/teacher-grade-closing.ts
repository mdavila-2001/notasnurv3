import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { AdminSubjectService, SubjectResponse } from '../../../admin/services/admin-subject.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Loader } from '../../../../shared/components/loader/loader';
import { Button } from '../../../../shared/components/button/button';
import { Modal } from '../../../../shared/components/modal/modal';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-grade-closing',
  standalone: true,
  imports: [CommonModule, FormsModule, Loader, Button, Modal],
  templateUrl: './teacher-grade-closing.html',
  styleUrl: './teacher-grade-closing.css',
})
export class TeacherGradeClosing implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly adminSubjectService = inject(AdminSubjectService);
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly subjects = signal<SubjectResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isDownloading = signal<string | null>(null);
  readonly isClosingSubject = signal<string | null>(null);
  
  readonly searchFilter = signal('');
  readonly statusFilter = signal('ALL'); // ALL, ACTIVE, CLOSED

  // Confirm Modal state
  readonly isCloseModalOpen = signal(false);
  readonly selectedSubject = signal<SubjectResponse | null>(null);

  readonly filteredSubjects = computed(() => {
    const list = this.subjects();
    const query = this.searchFilter().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((sub) => {
      const matchesSearch =
        sub.name.toLowerCase().includes(query) ||
        sub.code.toLowerCase().includes(query);

      const matchesStatus = status === 'ALL' || sub.recordStatus === status;

      return matchesSearch && matchesStatus;
    });
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

  downloadPdf(subject: SubjectResponse): void {
    this.isDownloading.set(subject.id);

    const url = `/reports/subjects/${subject.id}/grades-report/pdf`;
    const mime = 'application/pdf';
    const filename = `grades-report-subject-${subject.id}.pdf`;

    this.apiService
      .downloadBlob(url, mime)
      .pipe(finalize(() => this.isDownloading.set(null)))
      .subscribe({
        next: (blob) => {
          this.triggerFileDownload(blob, filename, mime);
          this.toast.success(`Acta en PDF de ${subject.code} descargada.`, 'Descarga Exitosa');
        },
        error: () => {
          this.toast.error('No se pudo descargar el acta en PDF.', 'Error');
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
      .pipe(finalize(() => this.isClosingSubject.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(`La materia "${subject.name}" ha sido cerrada correctamente.`, 'Cierre Completado');
          // Actualizar el estado en local
          this.subjects.update((list) =>
            list.map((s) => (s.id === subject.id ? { ...s, recordStatus: 'CLOSED' } : s))
          );
          this.isClosingSubject.set(null);
          this.closeCloseModal();
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'No se pudo cerrar la materia. Intenta de nuevo.';
          this.toast.error(errMsg, 'Error');
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
