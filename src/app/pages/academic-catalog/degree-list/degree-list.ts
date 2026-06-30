import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminDegreeService, DegreeResponse, DegreeRequest } from '../../../features/admin/services/admin-degree.service';
import { AdminFacultyService, FacultyResponse } from '../../../features/admin/services/admin-faculty.service';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { DegreeFormComponent } from '../degree-form/degree-form';
import { ToastService } from '../../../shared/services/toast.service';

interface DegreeRow {
  id: number;
  code: string;
  name: string;
  facultyName: string;
  raw: DegreeResponse;
}

const COLUMNS: TableColumn[] = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'facultyName', label: 'Facultad' },
];

@Component({
  selector: 'app-degree-list',
  standalone: true,
  imports: [CommonModule, Table, Button, Modal, DegreeFormComponent],
  templateUrl: './degree-list.html',
  styleUrl: './degree-list.css',
})
export class DegreeListComponent {
  private readonly degreeService = inject(AdminDegreeService);
  private readonly facultyService = inject(AdminFacultyService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns = COLUMNS;
  readonly rows = signal<DegreeRow[]>([]);
  readonly faculties = signal<FacultyResponse[]>([]);
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selected = signal<DegreeResponse | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly toDelete = signal<DegreeResponse | null>(null);

  constructor() {
    this.loadFaculties();
    this.load();
  }

  loadFaculties() {
    this.facultyService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.faculties.set(r.data ?? []) });
  }

  load() {
    this.isLoading.set(true);
    this.degreeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const data = r.data ?? [];
          this.rows.set(data.map(d => ({
            id: d.id, code: d.code, name: d.name, facultyName: d.facultyName, raw: d,
          })));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  openNew() { this.selected.set(null); this.isFormModalOpen.set(true); }
  openEdit(row: DegreeRow) { this.selected.set(row.raw); this.isFormModalOpen.set(true); }
  closeForm() { this.isFormModalOpen.set(false); this.selected.set(null); }

  onSave(payload: DegreeRequest) {
    const editing = this.selected();
    const action$ = editing
      ? this.degreeService.update(editing.id, payload)
      : this.degreeService.create(payload);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.closeForm();
        this.load();
        this.toast.success(editing ? 'Carrera actualizada.' : 'Carrera creada.');
      },
      error: () => {},
    });
  }

  askDelete(row: DegreeRow) { this.toDelete.set(row.raw); this.isDeleteModalOpen.set(true); }
  cancelDelete() { this.toDelete.set(null); this.isDeleteModalOpen.set(false); }

  confirmDelete() {
    const item = this.toDelete();
    if (!item) return;
    this.degreeService.delete(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.cancelDelete(); this.load(); this.toast.success('Carrera eliminada.'); },
        error: () => this.cancelDelete(),
      });
  }
}
