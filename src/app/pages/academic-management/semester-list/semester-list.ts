import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicManagementService } from '../../../core/services/academic-management/academic-management.service';
import {
  ApiError,
  Management,
  Semester,
  SemesterRequest,
} from '../../../core/models/academic-management.model';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { Input, SelectOption } from '../../../shared/components/input/input';
import { SemesterFormComponent } from '../semester-form/semester-form';

interface SemesterTableRow {
  id: string;
  number: 1 | 2;
  startDate: string;
  endDate: string;
  managementYear: number | string;
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

  readonly columns = SEMESTER_COLUMNS;
  readonly semesters = signal<Semester[]>([]);
  readonly managements = signal<Management[]>([]);

  readonly tableRows = computed<SemesterTableRow[]>(() => {
    const semesters = this.semesters();
    const managements = this.managements();

    return semesters.map((item) => ({
      id: item.id,
      number: item.number,
      startDate: this.formatDate(item.startDate),
      endDate: this.formatDate(item.endDate),
      managementYear: item.management?.year ?? managements.find((m) => m.id === item.managementId)?.year ?? '-',
      raw: item,
    }));
  });
  readonly filterManagementId = signal<string>('all');
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selectedSemester = signal<Semester | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly semesterToDelete = signal<Semester | null>(null);

  constructor() {
    this.loadManagements();
  }

  get managementFilterOptions(): SelectOption[] {
    return [
      { label: 'Todas', value: 'all' },
      ...this.managements().map((item) => ({ label: String(item.year), value: item.id })),
    ];
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
        : this.academicManagementService.getSemestersByManagement(selectedManagement);

    request$.subscribe({
      next: (data) => {
        this.semesters.set(data);
        this.isLoading.set(false);
      },
      error: (error: ApiError) => {
        this.isLoading.set(false);
        this.showError(error, 'No se pudo cargar la lista de semestres.');
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

    action$.subscribe({
      next: () => {
        this.closeFormModal();
        this.refreshSemesters();
        alert(editing ? 'Semestre actualizado correctamente.' : 'Semestre creado correctamente.');
      },
      error: (error: ApiError) => {
        this.showError(
          error,
          editing ? 'No se pudo actualizar el semestre.' : 'No se pudo crear el semestre.'
        );
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

    this.academicManagementService.deleteSemester(selected.id).subscribe({
      next: () => {
        this.cancelDelete();
        this.refreshSemesters();
        alert('Semestre eliminado correctamente.');
      },
      error: (error: ApiError) => {
        this.cancelDelete();
        this.showError(error, 'No se pudo eliminar el semestre.');
      },
    });
  }

  private loadManagements() {
    this.academicManagementService.getManagements().subscribe({
      next: (data) => {
        this.managements.set(data);
        this.refreshSemesters();
      },
      error: (error: ApiError) => {
        this.showError(error, 'No se pudieron cargar las gestiones para el filtro.');
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
