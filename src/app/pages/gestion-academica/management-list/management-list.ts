import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionAcademicaService } from '../../../core/services/gestion-academica.service';
import {
  ApiError,
  Management,
  ManagementRequest,
} from '../../../core/models/gestion-academica.model';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { ManagementFormComponent } from '../management-form/management-form';

interface ManagementTableRow {
  id: string;
  year: number;
  createdAt: string;
  raw: Management;
}

const MANAGEMENT_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'year', label: 'Año' },
  { key: 'createdAt', label: 'Fecha de creación' },
];

@Component({
  selector: 'app-management-list',
  standalone: true,
  imports: [CommonModule, Table, Button, Modal, ManagementFormComponent],
  templateUrl: './management-list.html',
  styleUrl: './management-list.css',
})
export class ManagementListComponent {
  private readonly gestionAcademicaService = inject(GestionAcademicaService);

  readonly columns = MANAGEMENT_COLUMNS;
  readonly managements = signal<Management[]>([]);
  readonly tableRows = signal<ManagementTableRow[]>([]);
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selectedManagement = signal<Management | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly managementToDelete = signal<Management | null>(null);

  constructor() {
    this.refreshList();
  }

  get existingYears() {
    return this.managements().map((item) => item.year);
  }

  refreshList() {
    this.isLoading.set(true);
    this.gestionAcademicaService.getManagements().subscribe({
      next: (data) => {
        this.managements.set(data);
        this.tableRows.set(
          data.map((item) => ({
            id: item.id,
            year: item.year,
            createdAt: this.formatDate(item.createdAt),
            raw: item,
          }))
        );
        this.isLoading.set(false);
      },
      error: (error: ApiError) => {
        this.isLoading.set(false);
        this.showError(error, 'No se pudo cargar la lista de gestiones.');
      },
    });
  }

  openNewModal() {
    this.selectedManagement.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(row: ManagementTableRow) {
    this.selectedManagement.set(row.raw);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.selectedManagement.set(null);
  }

  onSave(payload: ManagementRequest) {
    const editing = this.selectedManagement();

    const action$ = editing
      ? this.gestionAcademicaService.updateManagement(editing.id, payload)
      : this.gestionAcademicaService.createManagement(payload);

    action$.subscribe({
      next: () => {
        this.closeFormModal();
        this.refreshList();
        alert(editing ? 'Gestión actualizada correctamente.' : 'Gestión creada correctamente.');
      },
      error: (error: ApiError) => {
        if (error.status === 409) {
          alert('Ya existe una gestión con ese año.');
          return;
        }

        this.showError(
          error,
          editing ? 'No se pudo actualizar la gestión.' : 'No se pudo crear la gestión.'
        );
      },
    });
  }

  askDelete(row: ManagementTableRow) {
    this.managementToDelete.set(row.raw);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete() {
    this.managementToDelete.set(null);
    this.isDeleteModalOpen.set(false);
  }

  confirmDelete() {
    const selected = this.managementToDelete();
    if (!selected) {
      return;
    }

    this.gestionAcademicaService.deleteManagement(selected.id).subscribe({
      next: () => {
        this.cancelDelete();
        this.refreshList();
        alert('Gestión eliminada correctamente.');
      },
      error: (error: ApiError) => {
        this.cancelDelete();
        this.showError(error, 'No se pudo eliminar la gestión.');
      },
    });
  }

  private formatDate(value?: string) {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString('es-BO');
  }

  private showError(error: ApiError, fallback: string) {
    const message = error?.message?.trim() || fallback;
    alert(message);
    console.error(error);
  }
}
