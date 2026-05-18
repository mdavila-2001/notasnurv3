import { NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, TemplateRef, input, output } from '@angular/core';
import { Button } from '../button/button';

export interface TableColumn {
  key: string;
  label: string;
}

export interface CustomRowContext<T> {
  $implicit: T;
  row: T;
  index: number;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgTemplateOutlet, Button],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table<T extends object = Record<string, unknown>> {
  columns = input.required<TableColumn[]>();
  data = input.required<T[]>();

  showActions = input<boolean>(false);
  showEditAction = input<boolean>(true);
  showDeleteAction = input<boolean>(false);

  @ContentChild('customRow') customRowTemplate?: TemplateRef<CustomRowContext<T>>;

  rowClicked = output<T>();
  editClicked = output<T>();
  deleteClicked = output<T>();

  readonly hasActions = () => this.showActions();

  trackRow(row: T, index: number): string | number {
    const candidate = row as { id?: string | number };
    return candidate.id ?? index;
  }

  getCellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  onRowClick(row: T): void {
    this.rowClicked.emit(row);
  }

  onEdit(row: T, event?: MouseEvent): void {
    event?.stopPropagation();
    this.editClicked.emit(row);
  }

  onDelete(row: T, event?: MouseEvent): void {
    event?.stopPropagation();
    this.deleteClicked.emit(row);
  }
}
