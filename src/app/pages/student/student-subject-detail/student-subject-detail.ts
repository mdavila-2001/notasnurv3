import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { Loader } from '../../../shared/components/loader/loader';
import { Button } from '../../../shared/components/button/button';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { ToastService } from '../../../shared/services/toast.service';

interface GradeTableRow {
  id: string;
  componentName: string;
  weight: string;
  obtainedScore: string;
}

@Component({
  selector: 'app-student-subject-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Loader, Button, Table],
  templateUrl: './student-subject-detail.html',
  styleUrl: './student-subject-detail.css',
})
export class StudentSubjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentPortalService = inject(StudentPortalService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly subjectId = signal<string | null>(null);
  readonly subjectDetail = signal<any | null>(null);
  readonly error = signal<string>('');

  readonly columns = signal<TableColumn[]>([
    { key: 'componentName', label: 'Componente / Hito de Evaluación' },
    { key: 'weight', label: 'Ponderación (%)' },
    { key: 'obtainedScore', label: 'Nota Obtenida' }
  ]);

  readonly finalGrade = computed(() => {
    const detail = this.subjectDetail();
    if (!detail) return 0;
    return detail.currentGrade ?? 0;
  });

  readonly absencesCount = computed(() => {
    const detail = this.subjectDetail();
    if (!detail) return 0;
    return detail.absences ?? 0;
  });

  readonly absenceLimit = computed(() => {
    const detail = this.subjectDetail();
    if (!detail) return 5;
    return detail.absenceLimit ?? 5;
  });

  readonly isAtAbsenceRisk = computed(() => {
    const detail = this.subjectDetail();
    if (!detail) return false;
    return detail.atRisk ?? false;
  });

  readonly academicStatus = computed(() => {
    const detail = this.subjectDetail();
    if (!detail) return 'PENDING';

    const grade = this.finalGrade();
    const absences = this.absencesCount();
    const limit = this.absenceLimit();

    if (absences >= limit) {
      return 'FAILED_BY_ABSENCES';
    } else if (grade >= 51) {
      return 'APPROVED';
    } else if (grade > 0 && absences < limit) {
      return 'FAILED';
    }
    return 'ACTIVE';
  });

  readonly tableData = computed<GradeTableRow[]>(() => {
    const detail = this.subjectDetail();
    if (!detail || !detail.gradeBreakdown) return [];

    return detail.gradeBreakdown.map((item: any, index: number) => {
      const weight = item.weight ?? 0;
      const score = item.score ?? 0;

      return {
        id: `grade-comp-${index}`,
        componentName: item.name || 'Componente de Evaluación',
        weight: `${weight}%`,
        obtainedScore: score.toFixed(2)
      };
    });
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.subjectId.set(id);
      if (id) {
        this.loadSubjectGrades(id);
      } else {
        this.error.set('No se proporcionó un código o identificador de materia válido.');
        this.isLoading.set(false);
      }
    });
  }

  loadSubjectGrades(id: string): void {
    this.isLoading.set(true);
    this.error.set('');

    this.studentPortalService.getStudentDashboard().subscribe({
      next: (dashboardData) => {
        if (!dashboardData || !dashboardData.enrolledSubjects) {
          this.error.set('No se encontró información de materias activas en tu panel.');
          this.isLoading.set(false);
          return;
        }

        const subject = dashboardData.enrolledSubjects.find((s: any) =>
          s.subjectCode === id ||
          s.subjectId?.toString() === id
        );

        if (!subject) {
          this.error.set(`No estás matriculado en la materia con código/ID "${id}" o no pertenece a esta gestión.`);
          this.isLoading.set(false);
          return;
        }

        this.subjectDetail.set(subject);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Error al conectar con la base de datos de calificaciones.');
        this.toastService.error('No se pudo cargar el desglose de notas.');
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      APPROVED: 'badge-approved',
      FAILED: 'badge-failed',
      FAILED_BY_ABSENCES: 'badge-absences',
      ACTIVE: 'badge-active'
    };
    return classes[status] || 'badge-pending';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      APPROVED: 'Aprobado',
      FAILED: 'Reprobado',
      FAILED_BY_ABSENCES: 'Reprobado por Faltas',
      ACTIVE: 'Cursando'
    };
    return labels[status] || 'Pendiente';
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }
}
