import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminFacultyService, FacultyResponse, FacultyRequest } from '../../../features/admin/services/admin-faculty.service';
import { Table, TableColumn } from '../../../shared/components/table/table';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { FacultyFormComponent } from '../faculty-form/faculty-form';
import { ToastService } from '../../../shared/services/toast.service';

interface FacultyRow {
  id: number;
  name: string;
  code: string;
  raw: FacultyResponse;
}

const COLUMNS: TableColumn[] = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
];

@Component({
  selector: 'app-faculty-list',
  standalone: true,
  imports: [CommonModule, Table, Button, Modal, FacultyFormComponent],
  templateUrl: './faculty-list.html',
  styleUrl: './faculty-list.css',
})
export class FacultyListComponent {
  private readonly service = inject(AdminFacultyService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns = COLUMNS;
  readonly rows = signal<FacultyRow[]>([]);
  readonly isLoading = signal(false);

  readonly isFormModalOpen = signal(false);
  readonly selected = signal<FacultyResponse | null>(null);

  readonly isDeleteModalOpen = signal(false);
  readonly toDelete = signal<FacultyResponse | null>(null);

  constructor() {
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.service.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const data = r.data ?? [];
          this.rows.set(data.map(f => ({ id: f.id, name: f.name, code: f.code, raw: f })));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  openNew() { this.selected.set(null); this.isFormModalOpen.set(true); }
  openEdit(row: FacultyRow) { this.selected.set(row.raw); this.isFormModalOpen.set(true); }
  closeForm() { this.isFormModalOpen.set(false); this.selected.set(null); }

  onSave(payload: FacultyRequest) {
    const editing = this.selected();
    const action$ = editing
      ? this.service.update(editing.id, payload)
      : this.service.create(payload);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.closeForm();
        this.load();
        this.toast.success(editing ? 'Facultad actualizada.' : 'Facultad creada.');
      },
      error: () => {},
    });
  }

  askDelete(row: FacultyRow) { this.toDelete.set(row.raw); this.isDeleteModalOpen.set(true); }
  cancelDelete() { this.toDelete.set(null); this.isDeleteModalOpen.set(false); }

  confirmDelete() {
    const item = this.toDelete();
    if (!item) return;
    this.service.delete(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.cancelDelete(); this.load(); this.toast.success('Facultad eliminada.'); },
        error: () => this.cancelDelete(),
      });
  }
}
