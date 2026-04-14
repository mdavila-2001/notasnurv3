import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableColumn } from '../../shared/components/table/table';
import { Button } from '../../shared/components/button/button';
import { Modal } from '../../shared/components/modal/modal';
import { User as UserService } from '../../core/services/user';

const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'lastName', label: 'Apellido' },
  { key: 'email', label: 'Correo Electrónico' },
  { key: 'status', label: 'Estado' }
];

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, Table, Button, Modal],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class Users implements OnInit {
  private userService = inject(UserService);
  allUsers = signal<any[]>([]);
  selectedTab = signal<'Docente' | 'Estudiante'>('Docente');
  searchQuery = signal('');
  selectedFacultad = signal('Todas las Facultades');
  isRegisterModalOpen = signal(false);

  userColumns = COLUMNS;
  newUser: any = this.getEmptyUserStructure();

  ngOnInit() {
    this.loadUsers();
  }


  loadUsers() {
    const role = this.selectedTab() === 'Docente' ? 'TEACHER' : 'STUDENT';
    this.userService.getUsersByRole(role).subscribe({
      next: (data: any[]) => {
        console.log(`Usuarios (${role}) cargados:`, data);
        this.allUsers.set(data);
      },
      error: (err) => console.error("Error al cargar usuarios:", err)
    });
  }
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allUsers().filter(user => {
      const fullName = `${user.name} ${user.lastName} ${user.email}`.toLowerCase();
      const matchesSearch = fullName.includes(query);
      
      const matchesFacultad = this.selectedFacultad() === 'Todas las Facultades' || 
                              user.facultad === this.selectedFacultad();
      
      return matchesSearch && matchesFacultad;
    });
  });

  totalUsersCount = computed(() => this.allUsers().length);
  activeUsersCount = computed(() => this.allUsers().filter(u => u.status === 'ACTIVE').length);

  saveUser() {
    const isEditing = !!this.newUser.id;
    
    const payload = {
      ...(isEditing && { id: this.newUser.id }),
      name: this.newUser.name?.trim() || '',
      middleName: this.newUser.middleName?.trim() || '',
      lastName: this.newUser.lastName?.trim() || '',
      motherLastName: this.newUser.motherLastName?.trim() || '',
      ci: this.newUser.ci ? String(this.newUser.ci) : '0',
      email: this.newUser.email?.trim() || '',
      password: this.newUser.password || '123456',
      role: this.selectedTab() === 'Docente' ? 'TEACHER' : 'STUDENT',
      status: this.newUser.status || 'ACTIVE'
    };
    const action$ = isEditing
      ? this.userService.update(this.newUser.id, payload)
      : this.userService.create(payload);

    action$.subscribe({
      next: () => {
        this.loadUsers();
        this.closeRegisterModal();
        alert(isEditing ? '¡Usuario actualizado!' : '¡Usuario registrado en la DB!');
      },
      error: (err) => {
        console.error("Error en la operación:", err);
        const backendMessage = err?.error?.message;
        alert(backendMessage ? `Error: ${backendMessage}` : "Error: No se pudo procesar la solicitud. Verifica conexión con backend y datos enviados.");
      }
    });
  }

  onEdit(user: any) {
    this.newUser = {
      ...user,
      password: ''
    };
    this.isRegisterModalOpen.set(true);
  }

  onDelete(user: any) {
    if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.allUsers.update(list => list.filter(u => u.id !== user.id));
        },
        error: (err) => alert('Error al eliminar: ' + err.message)
      });
    }
  }

  toggleEstado(user: any): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.userService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        this.allUsers.update(list => 
          list.map(u => u.id === user.id ? { ...u, status: newStatus } : u)
        );
      },
      error: (err) => console.error('Error al cambiar estado:', err)
    });
  }

  // --- UI Y MODALES ---
  setTab(tab: 'Docente' | 'Estudiante') {
    this.selectedTab.set(tab);
    this.loadUsers();
  }

  openRegisterModal() {
    this.isRegisterModalOpen.set(true);
  }

  closeRegisterModal() {
    this.isRegisterModalOpen.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.newUser = this.getEmptyUserStructure();
  }

  private getEmptyUserStructure() {
    return {
      id: null,
      name: '',
      middleName: '',
      lastName: '',
      motherLastName: '',
      email: '',
      password: '',
      ci: '',
      facultad: 'Ingeniería de Sistemas',
      role: this.selectedTab() === 'Docente' ? 'TEACHER' : 'STUDENT',
      status: 'ACTIVE'
    };
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onFacultadChange(event: Event) {
    this.selectedFacultad.set((event.target as HTMLSelectElement).value);
  }


  getBadgeClass(facultad: string | undefined | null): string {
    if (!facultad) return 'badge-sistemas';

    const map: Record<string, string> = {
      'Ingeniería de Sistemas': 'badge-sistemas',
      'Ciencias Sociales': 'badge-sociales',
      'Economía': 'badge-economia',
      'Ciencias Económicas': 'badge-economia'
    };

    return map[facultad] || 'badge-default';
  }
}