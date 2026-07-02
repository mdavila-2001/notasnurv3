import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import {
  Management,
  Semester,
  SemesterRequest,
} from '../../../core/models/academic-management.model';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { Input, SelectOption } from '../../../shared/components/input/input';
import { SemesterFormComponent } from '../semester-form/semester-form';
import { ToastService } from '../../../shared/services/toast.service';

interface SemesterTableRow {
  id: number;
  number: 1 | 2;
  startDate: string;
  endDate: string;
  managementYear: number;
  raw: Semester;
}

const SEMESTER_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'number', label: 'Número' },
  { key: 'startDate', label: 'Fecha inicio' },
  { key: 'endDate', label: 'Fecha fin' },
  { key: 'managementYear', label: 'Gestión (año)' },
];

@Component({
  selector: 'app-semester-list',
  standalone: true,
  imports: [CommonModule, Table, Button, Modal, Input, SemesterFormComponent],
  templateUrl: './semester-list.html',
  styleUrl: './semester-list.css',
})
export class SemesterListComponent {
  private readonly academicManagementService = inject(AcademicManagementService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns = SEMESTER_COLUMNS;
  readonly semesters = signal<Semester[]>([]);
  readonly managements = signal<Management[]>([]);

  readonly tableRows = computed<SemesterTableRow[]>(() => {
    return this.semesters().map((item) => ({
      id: item.id,
      number: item.number,
      startDate: this.formatDate(item.startDate),
      endDate: this.formatDate(item.endDate),
      managementYear: item.managementYear,
      raw: item,
    }));
  });
  readonly filterManagementId = signal<string>('all');
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selectedSemester = signal<Semester | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly semesterToDelete = signal<Semester | null>(null);

  readonly managementFilterOptions = computed<SelectOption[]>(() => [
    { label: 'Todas', value: 'all' },
    ...this.managements().map((item) => ({ label: String(item.year), value: String(item.id) })),
  ]);

  constructor() {
    this.loadManagements();
  }

  onFilterChange(value: string | number) {
    this.filterManagementId.set(String(value));
    this.refreshSemesters();
  }

  refreshSemesters() {
    this.isLoading.set(true);

    const selectedManagement = this.filterManagementId();
    const request$ =
      selectedManagement === 'all'
        ? this.academicManagementService.getSemesters()
        : this.academicManagementService.getSemestersByManagement(Number(selectedManagement));

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.semesters.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  openNewModal() {
    this.selectedSemester.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(row: SemesterTableRow) {
    this.selectedSemester.set(row.raw);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.selectedSemester.set(null);
    this.isFormModalOpen.set(false);
  }

  onSave(payload: SemesterRequest) {
    const editing = this.selectedSemester();

    const action$ = editing
      ? this.academicManagementService.updateSemester(editing.id, payload)
      : this.academicManagementService.createSemester(payload);

    action$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeFormModal();
          this.refreshSemesters();
          this.toast.success(editing ? 'Semestre actualizado correctamente.' : 'Semestre creado correctamente.');
        },
        error: () => {
        },
      });
  }

  askDelete(row: SemesterTableRow) {
    this.semesterToDelete.set(row.raw);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete() {
    this.semesterToDelete.set(null);
    this.isDeleteModalOpen.set(false);
  }

  confirmDelete() {
    const selected = this.semesterToDelete();
    if (!selected) {
      return;
    }

    this.academicManagementService.deleteSemester(selected.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelDelete();
          this.refreshSemesters();
          this.toast.success('Semestre eliminado correctamente.');
        },
        error: () => {
          this.cancelDelete();
        },
      });
  }

  private loadManagements() {
    this.academicManagementService.getManagements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.managements.set(data);
          this.refreshSemesters();
        },
        error: () => {
        },
      });
  }

  private formatDate(value?: string) {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString('es-BO');
  }
}
