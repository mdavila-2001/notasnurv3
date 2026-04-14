import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionAcademicaService } from '../../../core/services/gestion-academica.service';
import {
  ApiError,
  Management,
  Semester,
  SemesterRequest,
} from '../../../core/models/gestion-academica.model';
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
  { key: 'number', label: 'Numero' },
  { key: 'startDate', label: 'Fecha inicio' },
  { key: 'endDate', label: 'Fecha fin' },
  { key: 'managementYear', label: 'Gestion (anio)' },
];

@Component({
  selector: 'app-semester-list',
  standalone: true,
  imports: [CommonModule, Table, Button, Modal, Input, SemesterFormComponent],
  templateUrl: './semester-list.html',
  styleUrl: './semester-list.css',
})
export class SemesterListComponent {
  private readonly gestionAcademicaService = inject(GestionAcademicaService);

  readonly columns = SEMESTER_COLUMNS;
  readonly semesters = signal<Semester[]>([]);
  readonly tableRows = signal<SemesterTableRow[]>([]);
  readonly managements = signal<Management[]>([]);
  readonly filterManagementId = signal<string>('all');
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selectedSemester = signal<Semester | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly semesterToDelete = signal<Semester | null>(null);

  constructor() {
    this.loadManagements();
    this.refreshSemesters();
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
        ? this.gestionAcademicaService.getSemesters()
        : this.gestionAcademicaService.getSemestersByManagement(selectedManagement);

    request$.subscribe({
      next: (data) => {
        this.semesters.set(data);
        this.tableRows.set(
          data.map((item) => ({
            id: item.id,
            number: item.number,
            startDate: this.formatDate(item.startDate),
            endDate: this.formatDate(item.endDate),
            managementYear: item.management?.year ?? this.findManagementYear(item.managementId),
            raw: item,
          }))
        );
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
      ? this.gestionAcademicaService.updateSemester(editing.id, payload)
      : this.gestionAcademicaService.createSemester(payload);

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

    this.gestionAcademicaService.deleteSemester(selected.id).subscribe({
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
    this.gestionAcademicaService.getManagements().subscribe({
      next: (data) => {
        this.managements.set(data);
      },
      error: (error: ApiError) => {
        this.showError(error, 'No se pudieron cargar las gestiones para el filtro.');
      },
    });
  }

  private findManagementYear(managementId: string) {
    return this.managements().find((item) => item.id === managementId)?.year ?? '-';
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
