import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectListComponent } from './subject-list';
import { AdminSubjectService } from '../../../features/admin/services/admin-subject.service';
import { AdminUserService } from '../../../features/admin/services/admin-user.service';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SubjectResponse, SubjectRequest } from '../../../core/models/subject.model';
import { Semester } from '../../../core/models/academic-management.model';
import { UserResponse } from '../../../core/models/api.models';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('SubjectListComponent', () => {
  let component: SubjectListComponent;
  let fixture: ComponentFixture<SubjectListComponent>;
  let mockToastService: any;

  const mockAdminSubjectService = {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    delete: vi.fn(),
  };

  const mockAdminUserService = {
    getByRole: vi.fn(),
  };

  const mockAcademicService = {
    getSemesters: vi.fn(),
  };

  const mockSemesters: Semester[] = [
    { id: 1, number: 1, managementYear: 2026, startDate: '2026-01-01', endDate: '2026-06-30', managementId: 1 },
    { id: 2, number: 2, managementYear: 2026, startDate: '2026-07-01', endDate: '2026-12-31', managementId: 1 },
  ];

  const mockTeachers: UserResponse[] = [
    { id: 't1', fullName: 'Docente Uno', name: 'Docente', middleName: '', lastName: 'Uno', motherLastName: '', email: 't1@nur.edu.bo', role: 'TEACHER', status: 'ACTIVE', ci: '123' },
    { id: 't2', fullName: 'Docente Dos', name: 'Docente', middleName: '', lastName: 'Dos', motherLastName: '', email: 't2@nur.edu.bo', role: 'TEACHER', status: 'ACTIVE', ci: '456' },
  ];

  const mockSubjects: SubjectResponse[] = [
    {
      id: 's1',
      code: 'INF-101',
      name: 'Introducción',
      modality: 'FACE_TO_FACE',
      capacity: 30,
      semesterId: '1',
      teacherId: 't1',
      recordStatus: 'ACTIVE',
    },
    {
      id: 's2',
      code: 'INF-102',
      name: 'Estructuras',
      modality: 'ONLINE',
      capacity: 25,
      semesterId: '2',
      teacherId: 't2',
      recordStatus: 'DRAFT',
    },
  ];

  beforeEach(async () => {
    // Reset mock calls and implementations
    vi.resetAllMocks();

    mockAdminSubjectService.getAll.mockReturnValue(of(mockSubjects));
    mockAcademicService.getSemesters.mockReturnValue(of(mockSemesters));
    mockAdminUserService.getByRole.mockReturnValue(of({ data: mockTeachers }));

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SubjectListComponent],
      providers: [
        { provide: AdminSubjectService, useValue: mockAdminSubjectService },
        { provide: AdminUserService, useValue: mockAdminUserService },
        { provide: AcademicManagementService, useValue: mockAcademicService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data successfully on initialization', () => {
    expect(component.subjects()).toEqual(mockSubjects);
    expect(component.semesters()).toEqual(mockSemesters);
    expect(component.teachers()).toEqual(mockTeachers);

    // Verify computed options
    expect(component.semesterOptions()).toEqual([
      { label: 'Sem. 1 — Gestión 2026', value: '1' },
      { label: 'Sem. 2 — Gestión 2026', value: '2' },
    ]);

    expect(component.teacherOptions()).toEqual([
      { label: 'Docente Uno', value: 't1' },
      { label: 'Docente Dos', value: 't2' },
    ]);

    // Verify computed tableRows
    expect(component.tableRows()).toEqual([
      {
        ...mockSubjects[0],
        modalityDisplay: 'Presencial',
        statusDisplay: 'Activa',
      },
      {
        ...mockSubjects[1],
        modalityDisplay: 'Virtual',
        statusDisplay: 'Borrador',
      },
    ]);
  });

  it('should load subjects when backend returns a wrapped response object', () => {
    mockAdminSubjectService.getAll.mockReturnValue(of({ data: mockSubjects }));
    component.loadData();
    expect(component.subjects()).toEqual(mockSubjects);
  });

  it('should fallback to empty arrays when backend returns null or invalid format', () => {
    mockAdminSubjectService.getAll.mockReturnValue(of({ data: null }));
    mockAdminUserService.getByRole.mockReturnValue(of({ data: null }));
    component.loadData();
    expect(component.subjects()).toEqual([]);
    expect(component.teachers()).toEqual([]);
  });

  it('should display error toast when data loading fails', () => {
    mockAdminSubjectService.getAll.mockReturnValue(throwError(() => new Error('Error')));
    component.loadData();

    expect(mockToastService.error).toHaveBeenCalledWith('Error al cargar los datos');
  });

  it('should open and close form modal', () => {
    component.openFormModal(mockSubjects[0]);
    expect(component.selectedSubject()).toEqual(mockSubjects[0]);
    expect(component.isFormModalOpen()).toBe(true);

    component.closeFormModal();
    expect(component.selectedSubject()).toBeNull();
    expect(component.isFormModalOpen()).toBe(false);
  });

  describe('onSave', () => {
    const savePayload: SubjectRequest = {
      code: 'INF-103',
      name: 'Nuevas Tecnologías',
      modality: 'BLENDED',
      capacity: 20,
      semesterId: 1,
      teacherId: 't1',
      recordStatus: 'PUBLISHED',
    };

    it('should call create when selectedSubject is null (Create Mode) and reload data', () => {
      component.openFormModal(null);
      mockAdminSubjectService.create.mockReturnValue(of({}));
      // Spy on loadData
      const loadDataSpy = vi.spyOn(component, 'loadData');

      component.onSave(savePayload);

      expect(mockAdminSubjectService.create).toHaveBeenCalledWith({
        ...savePayload,
        semesterId: '1',
      });
      expect(mockToastService.success).toHaveBeenCalledWith('Materia creada exitosamente');
      expect(component.isFormModalOpen()).toBe(false);
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should call update when selectedSubject is defined (Edit Mode) and reload data', () => {
      component.openFormModal(mockSubjects[0]);
      mockAdminSubjectService.update.mockReturnValue(of({}));
      const loadDataSpy = vi.spyOn(component, 'loadData');

      component.onSave(savePayload);

      expect(mockAdminSubjectService.update).toHaveBeenCalledWith('s1', {
        ...savePayload,
        semesterId: '1',
      });
      expect(mockToastService.success).toHaveBeenCalledWith('Materia actualizada exitosamente');
      expect(component.isFormModalOpen()).toBe(false);
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should display error toast with server message when onSave fails', () => {
      component.openFormModal(null);
      const serverError = { error: { message: 'El código de materia ya existe' } };
      mockAdminSubjectService.create.mockReturnValue(throwError(() => serverError));

      component.onSave(savePayload);

      expect(mockToastService.error).toHaveBeenCalledWith('El código de materia ya existe');
    });

    it('should display generic error toast when onSave fails without message', () => {
      component.openFormModal(null);
      mockAdminSubjectService.create.mockReturnValue(throwError(() => new Error('Unknown')));

      component.onSave(savePayload);

      expect(mockToastService.error).toHaveBeenCalledWith('Error al guardar la materia');
    });
  });

  describe('onActivate', () => {
    it('should activate subject successfully and reload data', () => {
      mockAdminSubjectService.activate.mockReturnValue(of({}));
      const loadDataSpy = vi.spyOn(component, 'loadData');

      component.onActivate(mockSubjects[0]);

      expect(mockAdminSubjectService.activate).toHaveBeenCalledWith('s1');
      expect(mockToastService.success).toHaveBeenCalledWith('Materia activada correctamente');
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should show server error message when activation fails', () => {
      const serverError = { error: { message: 'Falta configurar ponderación' } };
      mockAdminSubjectService.activate.mockReturnValue(throwError(() => serverError));

      component.onActivate(mockSubjects[0]);

      expect(mockToastService.error).toHaveBeenCalledWith('Falta configurar ponderación');
    });

    it('should show fallback error message when activation fails without message', () => {
      mockAdminSubjectService.activate.mockReturnValue(throwError(() => new Error('Unknown')));

      component.onActivate(mockSubjects[0]);

      expect(mockToastService.error).toHaveBeenCalledWith('Error al activar la materia. Verifica que las ponderaciones sumen 100.');
    });
  });

  describe('delete flow', () => {
    it('should open delete modal on onDelete', () => {
      component.onDelete(mockSubjects[0]);
      expect(component.subjectToDelete()).toEqual(mockSubjects[0]);
      expect(component.isDeleteModalOpen()).toBe(true);
    });

    it('should close delete modal on closeDeleteModal', () => {
      component.onDelete(mockSubjects[0]);
      component.closeDeleteModal();
      expect(component.subjectToDelete()).toBeNull();
      expect(component.isDeleteModalOpen()).toBe(false);
    });

    it('should do nothing on confirmDelete if no subject is marked for deletion', () => {
      component.confirmDelete();
      expect(mockAdminSubjectService.delete).not.toHaveBeenCalled();
    });

    it('should call delete service, show toast, and reload on confirmDelete success', () => {
      component.onDelete(mockSubjects[0]);
      mockAdminSubjectService.delete.mockReturnValue(of({}));
      const loadDataSpy = vi.spyOn(component, 'loadData');

      component.confirmDelete();

      expect(mockAdminSubjectService.delete).toHaveBeenCalledWith('s1');
      expect(mockToastService.success).toHaveBeenCalledWith('Materia eliminada');
      expect(component.isDeleteModalOpen()).toBe(false);
      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should call delete service, show error toast, and close modal on confirmDelete failure', () => {
      component.onDelete(mockSubjects[0]);
      mockAdminSubjectService.delete.mockReturnValue(throwError(() => new Error('Unknown')));
      const loadDataSpy = vi.spyOn(component, 'loadData');

      component.confirmDelete();

      expect(mockAdminSubjectService.delete).toHaveBeenCalledWith('s1');
      expect(mockToastService.error).toHaveBeenCalledWith('Error al eliminar la materia');
      expect(component.isDeleteModalOpen()).toBe(false);
      expect(loadDataSpy).not.toHaveBeenCalled();
    });
  });
});
