import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminFacultyService, FacultyResponse } from '../../../features/admin/services/admin-faculty.service';
import { Modal } from '../../../shared/components/modal/modal';
import { Button } from '../../../shared/components/button/button';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Toast } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-faculty-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Button, Table, Toast],
  templateUrl: './faculty-list.html',
  styleUrl: './faculty-list.css',
})
export class FacultyListComponent implements OnInit {
  private readonly facultyService = inject(AdminFacultyService);

  readonly faculties = signal<FacultyResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isFormModalOpen = signal(false);
  readonly selectedFaculty = signal<FacultyResponse | null>(null);

  nameField = '';
  codeField = '';

  readonly isDeleteModalOpen = signal(false);
  readonly facultyToDelete = signal<FacultyResponse | null>(null);

  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  readonly columns: TableColumn[] = [
    { key: 'code', label: 'Código de Facultad' },
    { key: 'name', label: 'Nombre de la Facultad' },
  ];

  readonly tableRows = computed(() => this.faculties());

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.facultyService.getAll().subscribe({
      next: (response) => {
        this.faculties.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.displayToast('Error al cargar la lista de facultades', 'error');
        this.isLoading.set(false);
      }
    });
  }

  openFormModal(faculty?: any) {
    if (faculty) {
      this.selectedFaculty.set(faculty);
      this.nameField = faculty.name;
      this.codeField = faculty.code;
    } else {
      this.selectedFaculty.set(null);
      this.nameField = '';
      this.codeField = '';
    }
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.selectedFaculty.set(null);
    this.nameField = '';
    this.codeField = '';
  }

  onSave() {
    const name = this.nameField.trim();
    const code = this.codeField.trim();

    if (!name || !code) {
      this.displayToast('Todos los campos son obligatorios', 'error');
      return;
    }

    const payload = { name, code };
    const faculty = this.selectedFaculty();

    const request$ = faculty
      ? this.facultyService.update(faculty.id, payload)
      : this.facultyService.create(payload);

    request$.subscribe({
      next: () => {
        this.displayToast(faculty ? 'Facultad actualizada con éxito' : 'Facultad creada con éxito', 'success');
        this.loadData();
        this.closeFormModal();
      },
      error: (err: any) => {
        const backendMessage = err?.message || err?.error?.message;
        this.displayToast(backendMessage || 'Error al guardar la facultad', 'error');
      }
    });
  }

  onDelete(faculty: any) {
    this.facultyToDelete.set(faculty);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.facultyToDelete.set(null);
  }

  confirmDelete() {
    const faculty = this.facultyToDelete();
    if (!faculty) return;

    this.facultyService.delete(faculty.id).subscribe({
      next: () => {
        this.displayToast('Facultad eliminada con éxito', 'success');
        this.loadData();
        this.closeDeleteModal();
      },
      error: (err: any) => {
        const backendMessage = err?.message || err?.error?.message;
        this.displayToast(backendMessage || 'Error al eliminar la facultad', 'error');
        this.closeDeleteModal();
      }
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
