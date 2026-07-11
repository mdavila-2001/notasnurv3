import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminDegreeService, DegreeResponse } from '../../../features/admin/services/admin-degree.service';
import { AdminFacultyService, FacultyResponse } from '../../../features/admin/services/admin-faculty.service';
import { Modal } from '../../../shared/components/modal/modal';
import { Button } from '../../../shared/components/button/button';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Toast } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-degree-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Button, Table, Toast],
  templateUrl: './degree-list.html',
  styleUrl: './degree-list.css',
})
export class DegreeListComponent implements OnInit {
  private readonly degreeService = inject(AdminDegreeService);
  private readonly facultyService = inject(AdminFacultyService);

  readonly degrees = signal<DegreeResponse[]>([]);
  readonly faculties = signal<FacultyResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isFormModalOpen = signal(false);
  readonly selectedDegree = signal<DegreeResponse | null>(null);

  nameField = '';
  codeField = '';
  facultyIdField: number | null = null;

  readonly isDeleteModalOpen = signal(false);
  readonly degreeToDelete = signal<DegreeResponse | null>(null);

  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  readonly columns: TableColumn[] = [
    { key: 'code', label: 'Código Carrera' },
    { key: 'name', label: 'Nombre de la Carrera' },
    { key: 'facultyName', label: 'Facultad' },
  ];

  readonly tableRows = computed(() => this.degrees());

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    forkJoin({
      degrees: this.degreeService.getAll(),
      faculties: this.facultyService.getAll()
    }).subscribe({
      next: (result) => {
        this.degrees.set(result.degrees.data ?? []);
        this.faculties.set(result.faculties.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.displayToast('Error al cargar la información de carreras y facultades', 'error');
        this.isLoading.set(false);
      }
    });
  }

  openFormModal(degree?: any) {
    if (degree) {
      this.selectedDegree.set(degree);
      this.nameField = degree.name;
      this.codeField = degree.code;
      this.facultyIdField = degree.facultyId;
    } else {
      this.selectedDegree.set(null);
      this.nameField = '';
      this.codeField = '';
      this.facultyIdField = null;
    }
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.selectedDegree.set(null);
    this.nameField = '';
    this.codeField = '';
    this.facultyIdField = null;
  }

  onSave() {
    const name = this.nameField.trim();
    const code = this.codeField.trim();
    const facultyId = this.facultyIdField;

    if (!name || !code || !facultyId) {
      this.displayToast('Todos los campos son obligatorios', 'error');
      return;
    }

    const payload = { name, code, facultyId: Number(facultyId) };
    const degree = this.selectedDegree();

    const request$ = degree
      ? this.degreeService.update(degree.id, payload)
      : this.degreeService.create(payload);

    request$.subscribe({
      next: () => {
        this.displayToast(degree ? 'Carrera actualizada con éxito' : 'Carrera creada con éxito', 'success');
        this.loadData();
        this.closeFormModal();
      },
      error: (err: any) => {
        const backendMessage = err?.message || err?.error?.message;
        this.displayToast(backendMessage || 'Error al guardar la carrera', 'error');
      }
    });
  }

  onDelete(degree: any) {
    this.degreeToDelete.set(degree);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.degreeToDelete.set(null);
  }

  confirmDelete() {
    const degree = this.degreeToDelete();
    if (!degree) return;

    this.degreeService.delete(degree.id).subscribe({
      next: () => {
        this.displayToast('Carrera eliminada con éxito', 'success');
        this.loadData();
        this.closeDeleteModal();
      },
      error: (err: any) => {
        const backendMessage = err?.message || err?.error?.message;
        this.displayToast(backendMessage || 'Error al eliminar la carrera', 'error');
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
