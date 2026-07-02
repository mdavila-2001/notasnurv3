import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import {
  Management,
  ManagementRequest,
} from '../../../core/models/academic-management.model';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { ManagementFormComponent } from '../management-form/management-form';
import { ToastService } from '../../../shared/services/toast.service';

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
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns = MANAGEMENT_COLUMNS;
  readonly managements = signal<Management[]>([]);
  readonly tableRows = signal<ManagementTableRow[]>([]);
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selectedManagement = signal<Management | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly managementToDelete = signal<Management | null>(null);

  readonly existingYears = computed(() =>
    this.managements().map((item) => item.year)
  );

  constructor() {
    this.refreshList();
  }

  refreshList() {
    this.isLoading.set(true);
    this.academicManagementService.getManagements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
        error: () => {
          this.isLoading.set(false);
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

    action$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeFormModal();
          this.refreshList();
          this.toast.success(editing ? 'Gestión actualizada correctamente.' : 'Gestión creada correctamente.');
        },
        error: () => {
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

    this.academicManagementService.deleteManagement(selected.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelDelete();
          this.refreshList();
          this.toast.success('Gestión eliminada correctamente.');
        },
        error: () => {
          this.cancelDelete();
        },
      });
  }
}
