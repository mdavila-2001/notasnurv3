import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import { User as UserService } from '../../../core/services/user/user';
import { Subject, SubjectRequest } from '../../../core/models/subject.model';
import { Semester } from '../../../core/models/academic-management.model';
import { UserResponse } from '../../../core/models/user.model';
import { SubjectFormComponent } from '../subject-form/subject-form';
import { Modal } from '../../../shared/components/modal/modal';
import { Button } from '../../../shared/components/button/button';
import { SelectOption } from '../../../shared/components/input/input';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Toast } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, SubjectFormComponent, Modal, Button, Table, Toast],
  templateUrl: './subject-list.html',
  styleUrl: './subject-list.css',
})
export class SubjectListComponent implements OnInit {
  private readonly subjectService = inject(SubjectService);
  private readonly academicService = inject(AcademicManagementService);
  private readonly userService = inject(UserService);

  readonly subjects = signal<Subject[]>([]);
  readonly semesters = signal<Semester[]>([]);
  readonly teachers = signal<UserResponse[]>([]);

  readonly isLoading = signal(false);
  readonly isFormModalOpen = signal(false);
  readonly selectedSubject = signal<Subject | null>(null);

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
      modalityDisplay: sub.modality === 'PRESENCIAL' ? 'Presencial' : 'Semi-presencial',
      statusDisplay: sub.recordStatus === 'ACTIVE' ? 'Activa' : 'Borrador',
    }))
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      subjects: this.subjectService.getSubjects(),
      semesters: this.academicService.getSemesters(),
      teachers: this.userService.getUsersByRole('TEACHER'),
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

  openFormModal(subject: Subject | null = null) {
    this.selectedSubject.set(subject);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.selectedSubject.set(null);
  }

  onSave(payload: SubjectRequest) {
    const current = this.selectedSubject();
    const request$: import('rxjs').Observable<any> = current
      ? this.subjectService.updateSubject(current.id, payload)
      : this.subjectService.createSubject(payload);

    request$.subscribe({
      next: () => {
        this.displayToast(
          current ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente',
          'success'
        );
        this.closeFormModal();
        this.loadData();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Error al guardar la materia';
        this.displayToast(msg, 'error');
      },
    });
  }

  onActivate(subject: Subject) {
    this.subjectService.activateSubject(subject.id).subscribe({
      next: () => {
        this.displayToast('Materia activada correctamente', 'success');
        this.loadData();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Error al activar la materia. Verifica que las ponderaciones sumen 100.';
        this.displayToast(msg, 'error');
      },
    });
  }

  onDelete(subject: Subject) {
    if (confirm(`¿Estás seguro de eliminar la materia "${subject.name}"?`)) {
      this.subjectService.deleteSubject(subject.id).subscribe({
        next: () => {
          this.displayToast('Materia eliminada', 'success');
          this.loadData();
        },
        error: () => this.displayToast('Error al eliminar la materia', 'error'),
      });
    }
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
