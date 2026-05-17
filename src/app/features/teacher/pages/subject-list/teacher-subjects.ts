import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectResponse } from '../../../admin/services/admin-subject.service';
import { SubjectOperationalService } from '../../../../core/services/subject-operational/subject-operational.service';
import { EvaluationPlanService } from '../../services/evaluation-plan.service';
import { Table } from '../../../../shared/components/table/table';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';

// 👇 CORRECCIÓN 1: Importamos el componente de la pestaña que lanzaba el error
// (Verifica que esta ruta coincida con la ubicación real de tu archivo en el proyecto)
import { EvaluationPlanTab } from '../subject-detail/tabs/evaluation-plan-tab/evaluation-plan-tab';

@Component({
  selector: 'app-teacher-subjects',
  standalone: true,
  // 👇 Agregamos EvaluationPlanTab al arreglo
  imports: [CommonModule, Table, Button, Loader, EvaluationPlanTab], 
  templateUrl: './teacher-subjects.html',
  styleUrl: './teacher-subjects.css',
  providers: [SubjectOperationalService, EvaluationPlanService]
})
export class TeacherSubjects implements OnInit {
  // Inyecciones (Eliminamos EnrollmentApiService para no hacer llamadas manuales)
  private readonly authService = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly router = inject(Router);
  private readonly operationalService = inject(SubjectOperationalService);

  // Signals
  readonly allSubjects = signal<SubjectResponse[]>([]); 
  readonly selectedSubject = signal<SubjectResponse | null>(null);

  readonly activeTab = signal<'students' | 'evaluation'>('students');

  readonly isLoading = signal(false);
  readonly isResolvingProfile = signal(false);
  readonly errorMessage = signal('');

  // 👇 CORRECCIÓN 2: Respetamos la regla de Marcelo.
  // Ahora leemos el estado de carga y los alumnos directamente del Store.
  readonly isLoadingStudents = this.operationalService.isLoading;
  readonly enrolledStudents = computed(() => this.operationalService.students());

  // Columnas para la tabla de pre-visualización
  readonly previewColumns = [
    { key: 'fullName', label: 'Nombre Completo' },
    { key: 'ci', label: 'C.I.' }
  ];

  readonly mySubjects = computed(() => this.allSubjects());

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teacherService.getMySubjects()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.isResolvingProfile.set(false);
      }))
      .subscribe({
        next: (subjects) => {
          this.allSubjects.set(subjects || []);
        },
        error: () => {
          this.errorMessage.set('Error al cargar las materias asignadas.');
        },
      });
  }

  selectSubject(subject: SubjectResponse) {
    this.selectedSubject.set(subject);
    this.operationalService.setSubjectDirectly(subject); 
    
    // El Store se encarga de todo. ¡Cero GETs redundantes!
    this.operationalService.loadSubjectContext(String(subject.id)); 
  }

  setTab(tab: 'students' | 'evaluation') {
    this.activeTab.set(tab);
  }

  goToFullNomina() {
    const currentSubj = this.selectedSubject();
    if (!currentSubj) return;

    this.router.navigate(['/teacher/subject', currentSubj.id, 'students']);
  }
}