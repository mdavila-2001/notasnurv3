import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnrollmentService } from '../../../core/services/enrollment/enrollment';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { User as UserService } from '../../../core/services/user/user';
import { Subject } from '../../../core/models/subject.model';
import { UserResponse } from '../../../core/models/user.model';
import { StudentResponseDTO } from '../../../core/models/enrollment.model';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { Toast } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Modal, Toast],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly subjectService = inject(SubjectService);
  private readonly userService = inject(UserService);

  // Estado principal
  readonly subjects = signal<Subject[]>([]);
  readonly students = signal<UserResponse[]>([]);
  readonly selectedSubject = signal<Subject | null>(null);
  readonly enrolledStudents = signal<StudentResponseDTO[]>([]);

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);

  // Modal matricular
  readonly isEnrollModalOpen = signal(false);
  selectedStudentId = '';
  userDegreeId: number | null = null;

  // Toast
  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');


  // Solo materias publicadas
  readonly activeSubjects = computed(() =>
    this.subjects().filter(s => s.recordStatus === 'PUBLISHED')
  );


  // Opciones para el select de estudiantes en el modal
  readonly studentOptions = computed(() =>
    this.students().map(s => ({ value: s.id, label: `${s.fullName} (CI: ${s.ci})` }))
  );

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      subjects: this.subjectService.getSubjects(),
      students: this.userService.getUsersByRole('STUDENT'),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ subjects, students }) => {
          this.subjects.set(subjects);
          this.students.set(students);
        },
        error: () => this.displayToast('Error al cargar los datos', 'error'),
      });
  }

  selectSubject(subject: Subject) {
    this.selectedSubject.set(subject);
    this.loadEnrolledStudents(subject.id);
  }

  loadEnrolledStudents(subjectId: number) {
    this.isLoadingStudents.set(true);
    this.enrollmentService.getStudentsBySubject(subjectId)
      .pipe(finalize(() => this.isLoadingStudents.set(false)))
      .subscribe({
        next: (students) => this.enrolledStudents.set(students),
        error: () => this.displayToast('Error al cargar los alumnos matriculados', 'error'),
      });
  }

  openEnrollModal() {
    this.selectedStudentId = '';
    this.userDegreeId = null;
    this.isEnrollModalOpen.set(true);
  }

  closeEnrollModal() {
    this.isEnrollModalOpen.set(false);
  }

  confirmEnroll() {
    const subject = this.selectedSubject();
    if (!subject || !this.userDegreeId) {
      this.displayToast('Selecciona un alumno e ingresa el ID de expediente', 'error');
      return;
    }

    this.enrollmentService.enrollStudent({
      userDegreeId: this.userDegreeId,
      subjectId: subject.id,
    }).subscribe({
      next: (response) => {
        this.closeEnrollModal();
        this.displayToast(`${response.studentName} matriculado en ${response.subjectName}`, 'success');
        this.loadEnrolledStudents(subject.id);
        this.loadInitialData(); // Refrescar cupos
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Error al realizar la matrícula';
        this.displayToast(msg, 'error');
      },
    });
  }

  withdrawStudent(enrollmentId: string, studentName: string) {
    if (!confirm(`¿Dar de baja a ${studentName} de esta materia?`)) return;

    this.enrollmentService.withdrawStudent(enrollmentId).subscribe({
      next: () => {
        this.displayToast(`${studentName} dado de baja correctamente`, 'success');
        const subject = this.selectedSubject();
        if (subject) this.loadEnrolledStudents(subject.id);
        this.loadInitialData();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Error al dar de baja';
        this.displayToast(msg, 'error');
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
