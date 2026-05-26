import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AdminSubjectService, SubjectResponse } from '../../../features/admin/services/admin-subject.service';
import { EnrollmentApiService, StudentEnrolledResponse, EnrollmentResponse } from '../../../features/teacher/services/enrollment-api.service';
import { Loader } from '../../../shared/components/loader/loader';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { Toast } from '../../../shared/components/toast/toast';
import { AdminUserService } from '../../../features/admin/services/admin-user.service';
import { UserResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [Button, Loader, Modal, Toast],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly subjectService = inject(AdminSubjectService);
  private readonly adminUserService = inject(AdminUserService);

  readonly subjects = signal<SubjectResponse[]>([]);
  readonly selectedSubject = signal<SubjectResponse | null>(null);
  readonly enrolledStudents = signal<StudentEnrolledResponse[]>([]);

  readonly isLoading = signal(false);
  readonly isLoadingStudents = signal(false);

  readonly isEnrollModalOpen = signal(false);
  readonly isWithdrawModalOpen = signal(false);
  readonly isWithdrawing = signal(false);
  readonly pendingWithdrawEnrollmentId = signal<string | null>(null);
  readonly pendingWithdrawStudentName = signal('Estudiante');
  readonly userDegreeId = signal<number | null>(null);

  // New signals for dynamic student selection
  readonly studentsList = signal<UserResponse[]>([]);
  readonly userDegrees = signal<any[]>([]);
  readonly selectedUserId = signal<string | null>(null);
  readonly isDegreesLoading = signal<boolean>(false);
  readonly degreesError = signal<string>('');

  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  readonly activeSubjects = computed(() =>
    this.subjects().filter(s => s.recordStatus === 'PUBLISHED')
  );

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);

    this.adminUserService.getByRole('STUDENT').subscribe({
      next: (response) => {
        this.studentsList.set(response.data ?? []);
      },
      error: () => this.displayToast('Error al cargar la nómina de estudiantes', 'error')
    });

    this.subjectService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (subjects) => {
          this.subjects.set(subjects.data ?? []);
        },
        error: () => this.displayToast('Error al cargar las materias', 'error'),
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
    this.userDegreeId.set(null);
    this.selectedUserId.set(null);
    this.userDegrees.set([]);
    this.degreesError.set('');
    this.isEnrollModalOpen.set(true);
  }

  closeEnrollModal() {
    this.isEnrollModalOpen.set(false);
  }

  confirmEnroll() {
    const subject = this.selectedSubject();
    const userDegreeId = this.userDegreeId();

    if (!subject || userDegreeId === null) {
      this.displayToast('Por favor, selecciona un estudiante y su correspondiente carrera/expediente activo.', 'error');
      return;
    }

    this.enrollmentApi.enrollStudent({
      userDegreeId,
      subjectId: Number(subject.id),
    }).subscribe({
      next: (response) => {
        this.closeEnrollModal();
        this.displayToast(`${response.data?.studentName ?? 'Alumno'} matriculado en ${subject.name}`, 'success');
        this.loadEnrolledStudents(subject.id);
        this.loadInitialData();
      },
      error: (error: unknown) => {
        this.displayToast(this.extractErrorMessage(error, 'Error al realizar la matrícula'), 'error');
      },
    });
  }

  onStudentSelected(userId: string): void {
    if (!userId) {
      this.selectedUserId.set(null);
      this.userDegrees.set([]);
      this.userDegreeId.set(null);
      this.degreesError.set('');
      return;
    }

    this.selectedUserId.set(userId);
    this.userDegrees.set([]);
    this.userDegreeId.set(null);
    this.isDegreesLoading.set(true);
    this.degreesError.set('');

    this.enrollmentApi.getUserDegreesByUserId(userId)
      .pipe(finalize(() => this.isDegreesLoading.set(false)))
      .subscribe({
        next: (response) => {
          const activeRecords = (response.data ?? []).filter((d: any) => d.status === 'ACTIVE');
          this.userDegrees.set(activeRecords);
          
          if (activeRecords.length === 1) {
            this.userDegreeId.set(activeRecords[0].id);
          } else if (activeRecords.length === 0) {
            this.degreesError.set('Este estudiante no cuenta con un expediente académico activo en ninguna carrera.');
          }
        },
        error: () => {
          this.degreesError.set('Error al recuperar los expedientes académicos del estudiante.');
        }
      });
  }

  onUserDegreeSelected(value: string | number): void {
    if (!value) {
      this.userDegreeId.set(null);
      return;
    }
    this.userDegreeId.set(Number(value));
  }

  openWithdrawModal(enrollmentId: string | undefined, fullName: string | undefined): void {
    if (!enrollmentId) {
      this.displayToast('No se pudo identificar la matrícula para dar de baja', 'error');
      return;
    }

    this.pendingWithdrawEnrollmentId.set(enrollmentId);
    this.pendingWithdrawStudentName.set(fullName ?? 'Estudiante');
    this.isWithdrawModalOpen.set(true);
  }

  closeWithdrawModal(): void {
    if (this.isWithdrawing()) {
      return;
    }

    this.isWithdrawModalOpen.set(false);
    this.pendingWithdrawEnrollmentId.set(null);
    this.pendingWithdrawStudentName.set('Estudiante');
  }

  confirmWithdraw(): void {
    const enrollmentId = this.pendingWithdrawEnrollmentId();
    const studentName = this.pendingWithdrawStudentName();

    if (!enrollmentId) {
      this.displayToast('No se pudo identificar la matrícula para dar de baja', 'error');
      return;
    }

    this.withdrawStudent(enrollmentId, studentName);
  }

  withdrawStudent(enrollmentId: string | undefined, fullName: string | undefined): void {
    if (!enrollmentId) {
      this.displayToast('No se pudo identificar la matrícula para dar de baja', 'error');
      return;
    }

    const studentName = fullName ?? 'Estudiante';
    this.isWithdrawing.set(true);

    this.enrollmentApi.withdrawStudent(enrollmentId)
      .pipe(finalize(() => this.isWithdrawing.set(false)))
      .subscribe({
      next: () => {
        this.closeWithdrawModal();
        this.displayToast(`${studentName} dado de baja correctamente`, 'success');
        const subject = this.selectedSubject();
        if (subject) this.loadEnrolledStudents(subject.id);
        this.loadInitialData();
      },
      error: (error: unknown) => {
        this.displayToast(this.extractErrorMessage(error, 'Error al dar de baja'), 'error');
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

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const backendError = (error as { error?: { message?: string } }).error;

      if (backendError?.message?.trim()) {
        return backendError.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
