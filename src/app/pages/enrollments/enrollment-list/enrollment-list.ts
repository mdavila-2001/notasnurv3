import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AdminSubjectService, SubjectResponse } from '../../../features/admin/services/admin-subject.service';
import { AdminUserService } from '../../../features/admin/services/admin-user.service';
import { EnrollmentApiService, StudentEnrolledResponse, EnrollmentResponse } from '../../../features/teacher/services/enrollment-api.service';
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
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly subjectService = inject(AdminSubjectService);
  private readonly userService = inject(AdminUserService);

  readonly subjects = signal<SubjectResponse[]>([]);
  readonly students = signal<any[]>([]);
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = signal<StudentEnrolledResponse[]>([]);

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);

  readonly isEnrollModalOpen = signal(false);
  selectedStudentId = '';
  userDegreeId: number | null = null;

  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  readonly studentOptions = computed(() =>
    this.students().map(s => ({ value: s.id, label: `${s.fullName} (CI: ${s.ci})` }))
  );

  readonly activeSubjects = computed(() =>
    this.subjects().filter(s => s.recordStatus === 'PUBLISHED')
  );

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      subjects: this.subjectService.getAll().pipe(finalize(() => {})),
      students: this.userService.getByRole('STUDENT').pipe(finalize(() => {})),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ subjects, students }) => {
          this.subjects.set(subjects.data ?? []);
          this.students.set(students.data ?? []);
        },
        error: () => this.displayToast('Error al cargar los datos', 'error'),
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.loadEnrolledStudents(subject.id);
  }

  loadEnrolledStudents(subjectId: string) {
    this.isLoadingStudents.set(true);
    this.enrollmentApi.getStudentsBySubject(subjectId)
      .pipe(finalize(() => this.isLoadingStudents.set(false)))
      .subscribe({
        next: (response) => this.enrolledStudents.set(response.data ?? []),
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

    this.enrollmentApi.enrollStudent({
      userDegreeId: this.userDegreeId,
      subjectId: Number(subject.id),
    }).subscribe({
      next: (response) => {
        this.closeEnrollModal();
        this.displayToast(`${response.data?.studentName ?? 'Alumno'} matriculado en ${subject.name}`, 'success');
        this.loadEnrolledStudents(subject.id);
        this.loadInitialData();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Error al realizar la matrícula';
        this.displayToast(msg, 'error');
      },
    });
  }

  withdrawStudent(enrollmentId: string, studentName: string) {
    if (!confirm(`¿Dar de baja a ${studentName} de esta materia?`)) return;

    this.enrollmentApi.withdrawStudent(enrollmentId).subscribe({
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
