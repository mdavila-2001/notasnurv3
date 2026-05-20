import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AdminSubjectService } from '../../../features/admin/services/admin-subject.service';
import { AdminUserService } from '../../../features/admin/services/admin-user.service';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import { SubjectModality, SubjectRecordStatus, SubjectRequest, SubjectResponse } from '../../../core/models/subject.model';
import { Semester } from '../../../core/models/academic-management.model';
import { UserResponse } from '../../../core/models/api.models';
import { SubjectFormComponent } from '../subject-form/subject-form';
import { Modal } from '../../../shared/components/modal/modal';
import { Button } from '../../../shared/components/button/button';
import { SelectOption } from '../../../shared/components/input/input';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Toast } from '../../../shared/components/toast/toast';

const MODALITY_LABELS: Record<SubjectModality, string> = {
  FACE_TO_FACE: 'Presencial',
  BLENDED: 'Semi-presencial',
  ONLINE: 'Virtual',
};

const STATUS_LABELS: Record<SubjectRecordStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  INACTIVE: 'Inactiva',
  CLOSED: 'Cerrada',
};

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [SubjectFormComponent, Modal, Button, Table, Toast],
  templateUrl: './subject-list.html',
  styleUrl: './subject-list.css',
})
export class SubjectListComponent implements OnInit {
  private readonly adminSubjectService = inject(AdminSubjectService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly academicService = inject(AcademicManagementService);

  readonly subjects = signal<SubjectResponse[]>([]);
  readonly semesters = signal<Semester[]>([]);
  readonly teachers = signal<UserResponse[]>([]);

  readonly isLoading = signal(false);
  readonly isFormModalOpen = signal(false);
  readonly selectedSubject = signal<SubjectResponse | null>(null);

  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  readonly columns: TableColumn[] = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nombre' },
    { key: 'modalityDisplay', label: 'Modalidad' },
    { key: 'capacity', label: 'Cupos' },
    { key: 'semesterName', label: 'Semestre' },
    { key: 'teacherName', label: 'Docente' },
    { key: 'management', label: 'Gestión' },
    { key: 'statusDisplay', label: 'Estado' },
  ];

  // Opciones para el formulario de crear/editar
  readonly semesterOptions = computed<SelectOption[]>(() =>
    this.semesters().map(s => ({
      label: `Sem. ${s.number} — Gestión ${s.managementYear}`,
      value: String(s.id),
    }))
  );

  readonly teacherOptions = computed<SelectOption[]>(() =>
    this.teachers().map(t => ({
      label: t.fullName,
      value: t.id,
    }))
  );

  // El backend ya devuelve semesterName y teacherName — solo agrega campos de display
  readonly tableRows = computed(() =>
    this.subjects().map(sub => ({
      ...sub,
      modalityDisplay: MODALITY_LABELS[sub.modality],
      statusDisplay: STATUS_LABELS[sub.recordStatus],
    }))
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      subjects: this.adminSubjectService.getAll().pipe(
        map(r => Array.isArray(r) ? r : (r.data ?? []))
      ),
      semesters: this.academicService.getSemesters(),
      teachers: this.adminUserService.getByRole('TEACHER').pipe(map(r => r.data ?? [])),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ subjects, semesters, teachers }) => {
          this.subjects.set(Array.isArray(subjects) ? subjects : []);
          this.semesters.set(semesters);
          this.teachers.set(teachers);
        },
        error: () => this.displayToast('Error al cargar los datos', 'error'),
      });
  }

  openFormModal(subject: SubjectResponse | null = null) {
    this.selectedSubject.set(subject);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.selectedSubject.set(null);
  }

  onSave(payload: SubjectRequest) {
    const current = this.selectedSubject();
    const servicePayload = { ...payload, semesterId: String(payload.semesterId) };
    const request$ = current
      ? this.adminSubjectService.update(String(current.id), servicePayload)
      : this.adminSubjectService.create(servicePayload);

    request$.subscribe({
      next: () => {
        this.displayToast(
          current ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente',
          'success'
        );
        this.closeFormModal();
        this.loadData();
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err.error?.message || 'Error al guardar la materia';
        this.displayToast(msg, 'error');
      },
    });
  }

  onActivate(subject: SubjectResponse) {
    this.adminSubjectService.activate(String(subject.id)).subscribe({
      next: () => {
        this.displayToast('Materia activada correctamente', 'success');
        this.loadData();
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err.error?.message || 'Error al activar la materia. Verifica que las ponderaciones sumen 100.';
        this.displayToast(msg, 'error');
      },
    });
  }

  // Delete confirmation modal state
  readonly isDeleteModalOpen = signal(false);
  readonly subjectToDelete = signal<SubjectResponse | null>(null);

  onDelete(subject: SubjectResponse) {
    this.subjectToDelete.set(subject);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.subjectToDelete.set(null);
  }

  confirmDelete() {
    const subject = this.subjectToDelete();
    if (!subject) return;

    this.adminSubjectService.delete(String(subject.id)).subscribe({
      next: () => {
        this.displayToast('Materia eliminada', 'success');
        this.loadData();
        this.closeDeleteModal();
      },
      error: () => {
        this.displayToast('Error al eliminar la materia', 'error');
        this.closeDeleteModal();
      },
    });
  }

  displayToast(message: string, type: 'success' | 'error') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
  }

  onToastClosed() {
    this.showToast.set(false);
  }
}
