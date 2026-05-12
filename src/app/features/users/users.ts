import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from '../../shared/components/button/button';
import { Modal } from '../../shared/components/modal/modal';
import { AdminUserService, UserRequest } from '../admin/services/admin-user.service';
import { UserResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Modal],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Users implements OnInit {
  private readonly adminUserService = inject(AdminUserService);

  allUsers = signal<UserResponse[]>([]);
  selectedTab = signal<'Docente' | 'Estudiante'>('Docente');
  searchQuery = signal('');
  isRegisterModalOpen = signal(false);

  newUser: Partial<UserRequest & { id: string; password: string }> = this.getEmptyUserStructure();

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    const role = this.selectedTab() === 'Docente' ? 'TEACHER' : 'STUDENT';
    this.adminUserService.getByRole(role).subscribe({
      next: (response) => this.allUsers.set(response.data ?? []),
      error: (err: any) => console.error('Error al cargar usuarios:', err)
    });
  }

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allUsers().filter(user => {
      const searchText = `${user.fullName} ${user.ci} ${user.email}`.toLowerCase();
      return searchText.includes(query);
    });
  });

  totalUsersCount = computed(() => this.allUsers().length);
  activeUsersCount = computed(() => this.allUsers().filter(u => u.status === 'ACTIVE').length);

  saveUser() {
    const isEditing = !!(this.newUser as any).id;
    const password = (this.newUser as any).password?.trim() || '';

    if (!isEditing && !password) {
      alert('Debes ingresar una contraseña para crear el usuario.');
      return;
    }

    const payload: UserRequest = {
      name: this.newUser.name?.trim() || '',
      middleName: this.newUser.middleName?.trim() || '',
      lastName: this.newUser.lastName?.trim() || '',
      motherLastName: this.newUser.motherLastName?.trim() || '',
      ci: this.newUser.ci ? String(this.newUser.ci) : '',
      email: this.newUser.email?.trim() || '',
      role: this.selectedTab() === 'Docente' ? 'TEACHER' : 'STUDENT',
      status: 'ACTIVE',
    };

    if (password) {
      payload.password = password;
    }

    const action$ = isEditing
      ? this.adminUserService.update((this.newUser as any).id, payload)
      : this.adminUserService.create(payload);

    action$.subscribe({
      next: () => {
        this.loadUsers();
        this.closeRegisterModal();
        alert(isEditing ? '¡Usuario actualizado!' : '¡Usuario registrado correctamente!');
      },
      error: (err: any) => {
        const backendMessage = err?.error?.message;
        alert(backendMessage ? `Error: ${backendMessage}` : 'Error al procesar la solicitud.');
      }
    });
  }

  onEdit(user: UserResponse) {
    this.newUser = { ...user, password: '', role: user.role as 'TEACHER' | 'STUDENT', status: user.status as 'ACTIVE' | 'INACTIVE' | 'GRADUATED' };
    this.isRegisterModalOpen.set(true);
  }

  onDelete(user: UserResponse) {
    if (confirm(`¿Estás seguro de eliminar a ${user.fullName}?`)) {
      this.adminUserService.delete(user.id).subscribe({
        next: () => this.allUsers.update(list => list.filter(u => u.id !== user.id)),
        error: (err: any) => alert('Error al eliminar: ' + (err?.error?.message || err.message))
      });
    }
  }

  toggleEstado(user: UserResponse): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminUserService.updateStatus(user.id, newStatus).subscribe({
      next: () => this.allUsers.update(list =>
        list.map(u => u.id === user.id ? { ...u, status: newStatus } : u)
      ),
      error: (err: any) => console.error('Error al cambiar estado:', err)
    });
  }

  setTab(tab: 'Docente' | 'Estudiante') {
    this.selectedTab.set(tab);
    this.loadUsers();
  }

  openRegisterModal() {
    this.newUser = this.getEmptyUserStructure();
    this.isRegisterModalOpen.set(true);
  }

  closeRegisterModal() {
    this.isRegisterModalOpen.set(false);
    this.newUser = this.getEmptyUserStructure();
  }

  private getEmptyUserStructure() {
    return {
      id: null as any,
      name: '',
      middleName: '',
      lastName: '',
      motherLastName: '',
      email: '',
      password: '',
      ci: '',
      role: (this.selectedTab() === 'Docente' ? 'TEACHER' : 'STUDENT') as 'TEACHER' | 'STUDENT',
      status: 'ACTIVE' as 'ACTIVE',
    };
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
