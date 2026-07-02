import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Users } from './users';
import { AdminUserService } from '../admin/services/admin-user.service';
import { ToastService } from '../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { UserResponse } from '../../core/models/api.models';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;
  let mockAdminUserService: any;
  let mockToastService: any;

  const mockUsersList: UserResponse[] = [
    {
      id: 'user-1',
      ci: '123456',
      name: 'Juan',
      middleName: 'Carlos',
      lastName: 'Perez',
      motherLastName: 'Gomez',
      email: '123456@nur.edu.bo',
      role: 'STUDENT',
      status: 'ACTIVE',
      fullName: 'Juan Carlos Perez Gomez'
    },
    {
      id: 'user-2',
      ci: '789101',
      name: 'Maria',
      middleName: '',
      lastName: 'Lopez',
      motherLastName: 'Suarez',
      email: 'm.lopez@nur.edu.bo',
      role: 'TEACHER',
      status: 'INACTIVE',
      fullName: 'Maria Lopez Suarez'
    }
  ];

  beforeEach(async () => {
    mockAdminUserService = {
      getByRole: vi.fn().mockReturnValue(of({ success: true, data: mockUsersList })),
      create: vi.fn().mockReturnValue(of({ success: true, data: mockUsersList[0] })),
      update: vi.fn().mockReturnValue(of({ success: true, data: mockUsersList[0] })),
      delete: vi.fn().mockReturnValue(of({ success: true })),
      updateStatus: vi.fn().mockReturnValue(of({ success: true }))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        { provide: AdminUserService, useValue: mockAdminUserService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    fixture.detectChanges();
    expect(mockAdminUserService.getByRole).toHaveBeenCalledWith('TEACHER');
    expect(component.allUsers()).toEqual(mockUsersList);
  });

  it('should handle loadUsers error', () => {
    mockAdminUserService.getByRole.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();
    expect(mockToastService.error).toHaveBeenCalledWith('Error al cargar usuarios');
  });

  it('should filter users based on query', () => {
    fixture.detectChanges();
    component.searchQuery.set('juan');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('Juan');

    component.searchQuery.set('789101');
    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('Maria');
  });

  it('should switch tabs and load users accordingly', () => {
    fixture.detectChanges();
    mockAdminUserService.getByRole.mockClear();

    component.setTab('Estudiante');
    expect(component.selectedTab()).toBe('Estudiante');
    expect(mockAdminUserService.getByRole).toHaveBeenCalledWith('STUDENT');
  });

  it('should open and close register modal', () => {
    expect(component.isRegisterModalOpen()).toBe(false);
    component.openRegisterModal();
    expect(component.isRegisterModalOpen()).toBe(true);
    expect(component.newUser.name).toBe('');

    component.closeRegisterModal();
    expect(component.isRegisterModalOpen()).toBe(false);
  });

  it('should populate newUser onEdit', () => {
    const userToEdit = mockUsersList[0];
    component.onEdit(userToEdit);
    expect(component.isRegisterModalOpen()).toBe(true);
    expect(component.newUser.name).toBe(userToEdit.name);
    expect(component.newUser.middleName).toBe(userToEdit.middleName);
    expect(component.newUser.id).toBe(userToEdit.id);
  });

  it('should handle deletion flow', () => {
    const userToDelete = mockUsersList[0];
    component.onDelete(userToDelete);
    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.userToDelete()).toEqual(userToDelete);

    component.closeDeleteModal();
    expect(component.isDeleteModalOpen()).toBe(false);
    expect(component.userToDelete()).toBeNull();
  });

  it('should delete user on confirmDelete success', () => {
    fixture.detectChanges();
    const userToDelete = mockUsersList[0];
    component.onDelete(userToDelete);

    component.confirmDelete();
    expect(mockAdminUserService.delete).toHaveBeenCalledWith(userToDelete.id);
    expect(mockToastService.success).toHaveBeenCalledWith(`${userToDelete.fullName} eliminado correctamente`);
    expect(component.isDeleteModalOpen()).toBe(false);
  });

  it('should handle delete user error', () => {
    fixture.detectChanges();
    const userToDelete = mockUsersList[0];
    component.onDelete(userToDelete);
    mockAdminUserService.delete.mockReturnValue(throwError(() => new Error('Delete failed')));

    component.confirmDelete();
    expect(mockToastService.error).toHaveBeenCalledWith('Delete failed');
    expect(component.isDeleteModalOpen()).toBe(false);
  });

  it('should toggle user active status successfully', () => {
    fixture.detectChanges();
    const user = mockUsersList[0];
    component.toggleEstado(user);
    expect(mockAdminUserService.updateStatus).toHaveBeenCalledWith(user.id, 'INACTIVE');

    const inactiveUser = mockUsersList[1];
    component.toggleEstado(inactiveUser);
    expect(mockAdminUserService.updateStatus).toHaveBeenCalledWith(inactiveUser.id, 'ACTIVE');
  });

  it('should handle toggle status error', () => {
    fixture.detectChanges();
    const user = mockUsersList[0];
    mockAdminUserService.updateStatus.mockReturnValue(throwError(() => new Error('Toggle error')));
    component.toggleEstado(user);
    expect(mockToastService.error).toHaveBeenCalledWith('Error al cambiar estado del usuario');
  });

  it('should update student email automatically on CI change', () => {
    component.setTab('Estudiante');
    component.newUser.ci = '654321';
    component.onCiChange();
    expect(component.newUser.email).toBe('654321@nur.edu.bo');

    component.newUser.ci = '';
    component.onCiChange();
    expect(component.newUser.email).toBe('');
  });

  it('should not update email on CI change if selectedTab is Docente', () => {
    component.setTab('Docente');
    component.newUser.ci = '654321';
    component.newUser.email = 'docente@nur.edu.bo';
    component.onCiChange();
    expect(component.newUser.email).toBe('docente@nur.edu.bo');
  });

  it('should validate password on saveUser if registering a new user without password', () => {
    component.newUser.id = '';
    component.newUser.password = '';
    component.saveUser();
    expect(mockToastService.warning).toHaveBeenCalledWith('Debes ingresar una contraseña para crear el usuario.');
    expect(mockAdminUserService.create).not.toHaveBeenCalled();
  });

  it('should call create when saving a new user with password', () => {
    fixture.detectChanges();
    component.newUser.id = '';
    component.newUser.name = 'Carlos';
    component.newUser.lastName = 'Sosa';
    component.newUser.ci = '111222';
    component.newUser.email = 'c.sosa@nur.edu.bo';
    component.newUser.password = 'securepwd';

    component.saveUser();
    expect(mockAdminUserService.create).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalledWith('¡Usuario registrado correctamente!');
  });

  it('should call update when saving an edited user', () => {
    fixture.detectChanges();
    component.newUser.id = 'user-1';
    component.newUser.name = 'Juan Carlos';
    component.newUser.lastName = 'Perez';
    component.newUser.password = '';

    component.saveUser();
    expect(mockAdminUserService.update).toHaveBeenCalledWith('user-1', expect.any(Object));
    expect(mockToastService.success).toHaveBeenCalledWith('¡Usuario actualizado!');
  });

  it('should show toast error with backend message on saveUser error', () => {
    fixture.detectChanges();
    component.newUser.id = '';
    component.newUser.password = 'pwd';
    const errorResponse = { message: 'El correo ya existe' };
    mockAdminUserService.create.mockReturnValue(throwError(() => errorResponse));

    component.saveUser();
    expect(mockToastService.error).toHaveBeenCalledWith('El correo ya existe');
  });

  it('should handle search input change', () => {
    const inputEvent = { target: { value: 'search text' } } as any;
    component.onSearch(inputEvent);
    expect(component.searchQuery()).toBe('search text');
  });
});
