import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudentPortalService } from '../../../core/services/student-portal.service';
import { Loader } from '../../../shared/components/loader/loader';
import { Button } from '../../../shared/components/button/button';
import { Table, TableColumn } from '../../../shared/components/table/table';
import {
  MySubjectResponseDTO,
  KardexResponse,
  KardexEntryDTO
} from '../../../core/models/enrollment.model';

interface KardexTableRow {
  id: string;
  subjectCode: string;
  subjectName: string;
  semester: string;
  grade: string;
  status: string;
  entry?: KardexEntryDTO;
}

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, Loader, Button, Table],
  templateUrl: './student-portal.html',
  styleUrl: './student-portal.css'
})
export class StudentPortal implements OnInit {
  private readonly studentPortalService = inject(StudentPortalService);

  // ===== STATE SIGNALS =====
  readonly isLoading = signal<boolean>(true);
  readonly activeTab = signal<'subjects' | 'kardex'>('subjects');

  // ===== DATA SIGNALS =====
  readonly mySubjects = signal<MySubjectResponseDTO[]>([]);
  readonly kardexHistory = signal<KardexResponse | null>(null);
  readonly error = signal<string>('');

  // ===== COMPUTED SIGNALS =====
  readonly subjectsCount = computed(() => this.mySubjects().length);

  readonly kardexStats = computed(() => {
    const kardex = this.kardexHistory();
    if (!kardex) {
      return {
        totalCredits: 0,
        earnedCredits: 0,
        gpa: 0,
        passedSubjects: 0,
        failedSubjects: 0
      };
    }

    const passedCount = kardex.entries?.filter(
      e => e.status === 'PASSED'
    ).length ?? 0;
    const failedCount = kardex.entries?.filter(
      e => e.status === 'FAILED'
    ).length ?? 0;

    return {
      totalCredits: kardex.totalCredits,
      earnedCredits: kardex.earnedCredits,
      gpa: kardex.gpa ?? 0,
      passedSubjects: passedCount,
      failedSubjects: failedCount
    };
  });

  readonly filteredKardexEntries = computed(() => {
    const kardex = this.kardexHistory();
    if (!kardex || !kardex.entries) return [];
    return kardex.entries.sort(
      (a, b) => (b.semester?.localeCompare(a.semester || '') || 0)
    );
  });

  // ===== KARDEX TABLE SIGNALS =====
  readonly kardexTableColumns = signal<TableColumn[]>([
    { key: 'subjectCode', label: 'Código' },
    { key: 'subjectName', label: 'Materia' },
    { key: 'semester', label: 'Semestre' },
    { key: 'grade', label: 'Calificación' },
    { key: 'status', label: 'Estado' }
  ]);

  readonly kardexTableData = computed<KardexTableRow[]>(() => {
    return this.filteredKardexEntries().map((entry, index) => ({
      id: `kardex-${index}`,
      subjectCode: entry.subjectCode,
      subjectName: entry.subjectName,
      semester: entry.semester,
      grade: this.formatGrade(entry.grade),
      status: entry.status,
      entry: entry
    }));
  });

  ngOnInit(): void {
    this.loadStudentData();
  }

  /**
   * Load both active subjects and kardex history
   */
  private loadStudentData(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.studentPortalService.getStudentDashboardData().subscribe({
      next: (data: any) => { // <-- CORRECCIÓN: Agregado el tipo explícito ': any'
        this.mySubjects.set(data.mySubjects);
        
        // Transform backend Kardex payload to KardexResponse format with profile CI
        const transformedKardex = this.transformKardexData(data.kardexHistory, data.userProfile.ci);
        this.kardexHistory.set(transformedKardex);
        
        this.isLoading.set(false);
      },
      error: (err: any) => { // <-- CORRECCIÓN: Agregado el tipo explícito ': any'
        this.error.set(
          err?.message ||
            'Error al cargar los datos del estudiante. Intenta nuevamente.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Transform backend JSON response into KardexResponse format
   * Maps studentName -> fullName, flattens historyBySemester into entries array,
   * calculates GPA, handles null scores, and dynamically sets academicStatus
   * @param rawData The raw kardex data from backend
   * @param profileCi The student's CI from the user profile
   */
  private transformKardexData(rawData: any, profileCi: string): KardexResponse {
    // Default fallback values
    const studentName = rawData?.studentName || '-';
    const degreeName = rawData?.degreeName || '-';
    const studentId = rawData?.studentId || '-';
    const ci = profileCi || '-';  // Use profile CI instead of default

    // Flatten historyBySemester object into entries array
    const entries: KardexEntryDTO[] = [];
    const historyBySemester = rawData?.historyBySemester || {};
    let totalScore = 0;
    let scoreCount = 0;

    Object.entries(historyBySemester).forEach(([semesterKey, subjects]: [string, any]) => {
      if (Array.isArray(subjects)) {
        subjects.forEach((subject: any) => {
          // Map finalScore to grade; use '-' if null
          const grade = subject.finalScore !== null ? subject.finalScore : '-';
          
          // Count non-null scores for GPA calculation
          if (subject.finalScore !== null) {
            totalScore += subject.finalScore;
            scoreCount++;
          }

          entries.push({
            subjectCode: subject.subjectCode || '-',
            subjectName: subject.subjectName || '-',
            grade: grade,
            credits: subject.credits || 0,
            status: subject.status || 'PENDING',
            semester: semesterKey,
            teacherName: subject.teacherName || '-',
            enrollmentDate: subject.enrollmentDate || '-'
          });
        });
      }
    });

    // LÓGICA INTELIGENTE: Si el alumno tiene materias "ACTIVE", está cursando. Si no, es Regular.
    const academicStatus = entries.some(e => e.status === 'ACTIVE') 
      ? 'Regular (Cursando)' 
      : 'Regular';

    // Calculate GPA: average of non-null finalScores
    const gpa = scoreCount > 0 ? totalScore / scoreCount : 0;

    // Calculate totals
    const passedEntries = entries.filter(e => e.status === 'PASSED');
    const totalCredits = entries.reduce((sum, e) => sum + (e.credits || 0), 0);
    const earnedCredits = passedEntries.reduce((sum, e) => sum + (e.credits || 0), 0);

    return {
      studentId,
      fullName: studentName,
      ci,
      degreeName,
      totalCredits,
      earnedCredits,
      gpa: Math.round(gpa * 100) / 100, // Round to 2 decimals
      academicStatus,
      entries
    };
  }

  /**
   * Refresh the student data
   */
  refreshData(): void {
    this.loadStudentData();
  }

  /**
   * Switch between tabs
   */
  setTab(tab: 'subjects' | 'kardex'): void {
    this.activeTab.set(tab);
  }

  /**
   * Handle kardex row click to navigate to subject detail
   */
  onKardexRowClick(row: KardexTableRow): void {
    // This would be used if you add row click navigation
    // For now, the subject detail link is embedded in the template
  }

  /**
   * Get CSS class for grade status (PASSED, FAILED, ACTIVE, etc.)
   */
  getGradeStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      PASSED: 'status-passed',
      FAILED: 'status-failed',
      INCOMPLETE: 'status-incomplete',
      PENDING: 'status-pending',
      DROPPED: 'status-dropped',
      ACTIVE: 'status-pending' // <-- Modificado para que use el color amarillo de tu CSS existente
    };
    return statusMap[status] || 'status-default';
  }

  /**
   * Get display label for grade status
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PASSED: 'Aprobado',
      FAILED: 'Reprobado',
      INCOMPLETE: 'Incompleto',
      PENDING: 'Pendiente',
      DROPPED: 'Retirado',
      ACTIVE: 'Cursando'
    };
    return labels[status] || status;
  }

  /**
   * Get display label for modality
   */
  getModalityLabel(modality?: string): string {
    const labels: Record<string, string> = {
      FACE_TO_FACE: 'Presencial',
      BLENDED: 'Semipresencial',
      ONLINE: 'Virtual'
    };
    return labels[modality || 'ONLINE'] || modality || 'Virtual';
  }

  /**
   * Format grade for display
   */
  formatGrade(grade: number | string): string {
    if (typeof grade === 'string') {
      const num = parseFloat(grade);
      return isNaN(num) ? '-' : num.toFixed(2);
    }
    return grade.toFixed(2);
  }
}