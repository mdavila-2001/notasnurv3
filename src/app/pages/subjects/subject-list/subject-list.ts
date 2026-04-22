import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectService } from '../../../core/services/subject.service';
import { AcademicManagementService } from '../../../core/services/academic-management.service';
import { User as UserService } from '../../../core/services/user';
import { Subject, SubjectRequest } from '../../../core/models/subject.model';
import { Semester } from '../../../core/models/academic-management.model';
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
  readonly teachers = signal<any[]>([]);

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
    { key: 'semesterDisplay', label: 'Semestre' },
    { key: 'teacherDisplay', label: 'Docente' },
  ];

  readonly semesterOptions = computed<SelectOption[]>(() => {
    return this.semesters().map(s => ({
      label: `Semestre ${s.number} (${s.management?.year || 'Sin gestión'})`,
      value: s.id
    }));
  });

  readonly teacherOptions = computed<SelectOption[]>(() => {
    return this.teachers().map(t => ({
      label: `${t.name} ${t.lastName}`,
      value: t.id
    }));
  });

  readonly tableRows = computed(() => {
    const subs = this.subjects();
    const sems = this.semesters();
    const teach = this.teachers();

    return subs.map(sub => {
      const semester = sems.find(s => s.id === sub.semesterId);
      const teacher = teach.find(t => t.id === sub.teacherId);
      return {
        ...sub,
        modalityDisplay: sub.modality === 'PRESENCIAL' ? 'Presencial' : 'Semi-presencial',
        semesterDisplay: semester ? `Semestre ${semester.number}` : '-',
        teacherDisplay: teacher ? `${teacher.name} ${teacher.lastName}` : '-',
      };
    });
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    this.subjectService.getSubjects().subscribe({
      next: (data) => {
        this.subjects.set(Array.isArray(data) ? data : []);
      },
      error: () => this.displayToast('Error al cargar materias', 'error')
    });

    this.academicService.getSemesters().subscribe({
      next: (data) => this.semesters.set(data),
      error: () => this.displayToast('Error al cargar semestres', 'error')
    });

    this.userService.getUsersByRole('TEACHER').subscribe({
      next: (data) => this.teachers.set(data),
      error: () => this.displayToast('Error al cargar docentes', 'error')
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
    const request$ = current
      ? this.subjectService.updateSubject(current.id, payload)
      : this.subjectService.createSubject(payload);

    request$.subscribe({
      next: () => {
        this.displayToast(current ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente', 'success');
        this.closeFormModal();
        this.loadData();
      },
      error: () => this.displayToast('Error al guardar la materia', 'error')
    });
  }

  onDelete(subject: Subject) {
    if (confirm(`¿Estás seguro de eliminar la materia ${subject.name}?`)) {
      this.subjectService.deleteSubject(subject.id).subscribe({
        next: () => {
          this.displayToast('Materia eliminada', 'success');
          this.loadData();
        },
        error: () => this.displayToast('Error al eliminar', 'error')
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

