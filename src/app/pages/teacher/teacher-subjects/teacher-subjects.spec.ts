import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest'; // Importación clave para Vitest
import { TeacherSubjectsComponent } from './teacher-subjects';
import { Auth } from '../../../core/services/auth/auth';
import { SubjectService } from '../../../core/services/subject/subject.service';
import { EnrollmentService } from '../../../core/services/enrollment/enrollment';
import { Subject } from '../../../core/models/subject.model';
import { StudentResponseDTO } from '../../../core/models/enrollment.model';

describe('TeacherSubjectsComponent', () => {
  let component: TeacherSubjectsComponent;
  let fixture: ComponentFixture<TeacherSubjectsComponent>;
  // Cambiamos el tipado para evitar dependencias de Jasmine
  let authService: any;
  let subjectService: any;
  let enrollmentService: any;

  const mockTeacher = {
    data: { id: 'teacher-1', name: 'Test Teacher' }
  };

  const mockSubjects: Subject[] = [
    {
      id: 1,
      code: 'CS101',
      name: 'Intro to CS',
      teacherId: 'teacher-1',
      teacherName: 'Test Teacher',
      capacity: 30,
      semesterId: 1,
      semesterName: '2024-I',
      management: '2024',
      modality: 'FACE_TO_FACE', 
      recordStatus: 'PUBLISHED'
    },
    {
      id: 2,
      code: 'CS102',
      name: 'Data Structures',
      teacherId: 'teacher-1',
      teacherName: 'Test Teacher',
      capacity: 25,
      semesterId: 1,
      semesterName: '2024-I',
      management: '2024',
      modality: 'FACE_TO_FACE',
      recordStatus: 'PUBLISHED'
    }
  ];

  const mockStudents: StudentResponseDTO[] = [
    {
      studentId: 'std-1',
      fullName: 'Juan García',
      ci: '1234567',
      email: 'juan@example.com',
      degreeName: 'Ingeniería Informática',
      academicStatus: 'Active'
    },
    {
      studentId: 'std-2',
      fullName: 'María López',
      ci: '7654321',
      email: 'maria@example.com',
      degreeName: 'Ingeniería Informática',
      academicStatus: 'Suspended'
    },
    {
      studentId: 'std-3',
      fullName: 'Carlos Martínez',
      ci: '5555555',
      email: 'carlos@example.com',
      degreeName: 'Ingeniería Informática',
      academicStatus: 'Active'
    }
  ];

  beforeEach(async () => {
    // CORREGIDO: Usamos vi.fn() de Vitest en lugar de los espías de Jasmine
    const authServiceSpy = { getMe: vi.fn().mockReturnValue(of(mockTeacher)) };
    const subjectServiceSpy = { getSubjects: vi.fn().mockReturnValue(of(mockSubjects)) };
    const enrollmentServiceSpy = { getStudentsBySubject: vi.fn().mockReturnValue(of(mockStudents)) };

    await TestBed.configureTestingModule({
      imports: [TeacherSubjectsComponent],
      providers: [
        { provide: Auth, useValue: authServiceSpy },
        { provide: SubjectService, useValue: subjectServiceSpy },
        { provide: EnrollmentService, useValue: enrollmentServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(Auth);
    subjectService = TestBed.inject(SubjectService);
    enrollmentService = TestBed.inject(EnrollmentService);

    fixture = TestBed.createComponent(TeacherSubjectsComponent);
    component = fixture.componentInstance;
  });

  describe('Renderizado', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render page title', () => {
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('.page-title');
      expect(title?.textContent).toContain('Mis Materias');
    });

    it('should display subjects panel', () => {
      fixture.detectChanges();
      const subjectsPanel = fixture.nativeElement.querySelector('.subjects-panel');
      expect(subjectsPanel).toBeTruthy();
    });

    it('should display students panel', () => {
      fixture.detectChanges();
      const studentsPanel = fixture.nativeElement.querySelector('.students-panel');
      expect(studentsPanel).toBeTruthy();
    });
  });

  describe('Carga de Contexto del Docente', () => {
    it('should load teacher context on init', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      expect(component.currentTeacherId()).toBe('teacher-1');
    }));

    it('should load subjects after teacher context is resolved', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      expect(component.allSubjects().length).toBe(2);
      expect(component.isResolvingProfile()).toBe(false);
    }));

    it('should filter subjects by teacher ID', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      expect(component.mySubjects().length).toBe(2);
      expect(component.mySubjects()[0].teacherId).toBe('teacher-1');
    }));
  });

  describe('Carga de Estudiantes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
    }));

    it('should load students when subject is selected', fakeAsync(() => {
      component.selectSubject(mockSubjects[0]);
      tick(50);
      expect(enrollmentService.getStudentsBySubject).toHaveBeenCalledWith(1);
      expect(component.enrolledStudents().length).toBe(3);
    }));

    it('should clear search query when loading new students', fakeAsync(() => {
      component.searchQuery.set('test');
      component.selectSubject(mockSubjects[0]);
      tick(50);
      expect(component.searchQuery()).toBe('');
    }));

    it('should handle 404 error with specific message', fakeAsync(() => {
      const error = { status: 404, error: {} };
      // CORREGIDO: Sintaxis de mock para Vitest
      enrollmentService.getStudentsBySubject.mockReturnValue(throwError(() => error));

      component.selectSubject(mockSubjects[0]);
      tick(50);
      expect(component.errorMessage()).toBe('No hay estudiantes inscritos en esta materia');
    }));

    it('should handle generic errors', fakeAsync(() => {
      const error = { status: 500, error: { message: 'Server error' } };
      // CORREGIDO: Sintaxis de mock para Vitest
      enrollmentService.getStudentsBySubject.mockReturnValue(throwError(() => error));

      component.selectSubject(mockSubjects[0]);
      tick(50);
      expect(component.errorMessage()).toBe('Server error');
    }));
  });

  describe('Filtro de Búsqueda', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      component.selectSubject(mockSubjects[0]);
      fixture.detectChanges();
      tick(50);
    }));

    it('should filter students by full name', () => {
      component.searchQuery.set('Juan');
      fixture.detectChanges();
      expect(component.filteredStudents().length).toBe(1);
      expect(component.filteredStudents()[0].fullName).toBe('Juan García');
    });

    it('should filter case-insensitively', () => {
      component.searchQuery.set('juan');
      fixture.detectChanges();
      expect(component.filteredStudents().length).toBe(1);
      expect(component.filteredStudents()[0].fullName).toBe('Juan García');
    });

    it('should show all students when search query is empty', () => {
      component.searchQuery.set('');
      fixture.detectChanges();
      expect(component.filteredStudents().length).toBe(3);
    });

    it('should return empty list when no match found', () => {
      component.searchQuery.set('NoExiste');
      fixture.detectChanges();
      expect(component.filteredStudents().length).toBe(0);
    });

    it('should filter by partial name match', () => {
      component.searchQuery.set('Mar');
      fixture.detectChanges();
      expect(component.filteredStudents().length).toBe(2); 
    });
  });

  describe('Mapeo de Estados Académicos', () => {
    it('should map "Active" to "info" badge type', () => {
      const type = component.getAcademicStatusType('Active');
      expect(type).toBe('info');
    });

    it('should map "activo" to "info" badge type (Spanish)', () => {
      const type = component.getAcademicStatusType('activo');
      expect(type).toBe('info');
    });

    it('should map "Suspended" to "warning" badge type', () => {
      const type = component.getAcademicStatusType('Suspended');
      expect(type).toBe('warning');
    });

    it('should map "suspendido" to "warning" badge type (Spanish)', () => {
      const type = component.getAcademicStatusType('suspendido');
      expect(type).toBe('warning');
    });

    it('should map "Inactive" to "warning" badge type', () => {
      const type = component.getAcademicStatusType('Inactive');
      expect(type).toBe('warning');
    });

    it('should map "inactivo" to "warning" badge type (Spanish)', () => {
      const type = component.getAcademicStatusType('inactivo');
      expect(type).toBe('warning');
    });

    it('should map unknown status to "dark" badge type', () => {
      const type = component.getAcademicStatusType('Unknown');
      expect(type).toBe('dark');
    });
  });

  describe('Estados de Carga', () => {
    it('should set isLoading flag when loading subjects', () => {
      component.loadSubjects();
      expect(component.isLoading()).toBe(true);
    });

    it('should set isLoadingStudents flag when loading students', fakeAsync(() => {
      component.selectedSubject.set(mockSubjects[0]);
      component.loadStudents(1);
      expect(component.isLoadingStudents()).toBe(true);
      tick(50);
      expect(component.isLoadingStudents()).toBe(false);
    }));
  });

  describe('Computed Signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
    }));

    it('mySubjects should filter by current teacher ID', () => {
      expect(component.mySubjects().length).toBe(2);
      component.currentTeacherId.set('different-teacher');
      expect(component.mySubjects().length).toBe(0);
    });

    it('filteredStudents should return all students when search is empty', () => {
      component.enrolledStudents.set(mockStudents);
      component.searchQuery.set('');
      expect(component.filteredStudents().length).toBe(3);
    });
  });
});