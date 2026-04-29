import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import {
  ApiError,
  Management,
  ManagementRequest,
} from '../../../core/models/academic-management.model';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { ManagementFormComponent } from '../management-form/management-form';

interface ManagementTableRow {
  id: number;
  year: number;
  raw: Management;
}

const MANAGEMENT_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'year', label: 'Año' },
];

@Component({
  selector: 'app-management-list',
  standalone: true,
  imports: [CommonModule, Table, Button, Modal, ManagementFormComponent],
  templateUrl: './management-list.html',
  styleUrl: './management-list.css',
})
export class ManagementListComponent {
  private readonly academicManagementService = inject(AcademicManagementService);

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
    this.academicManagementService.getManagements().subscribe({
      next: (data) => {
        this.managements.set(data);
        this.tableRows.set(
          data.map((item) => ({
            id: item.id,
            year: item.year,
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
      ? this.academicManagementService.updateManagement(editing.id, payload)
      : this.academicManagementService.createManagement(payload);

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

    this.academicManagementService.deleteManagement(selected.id).subscribe({
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

  private showError(error: ApiError, fallback: string) {
    const message = error?.message?.trim() || fallback;
    alert(message);
    console.error(error);
  }
}
