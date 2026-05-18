import { NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, TemplateRef, input, output } from '@angular/core';
import { Button } from '../button/button';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableRow {
  id?: string | number;
  [key: string]: unknown;
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
export class Table {
  columns = input.required<TableColumn[]>();
  data = input.required<TableRow[]>();

  showActions = input<boolean>(false);
  showEditAction = input<boolean>(true);
  showDeleteAction = input<boolean>(false);

  @ContentChild('customRow') customRowTemplate?: TemplateRef<CustomRowContext<TableRow>>;

  rowClicked = output<TableRow>();
  editClicked = output<TableRow>();
  deleteClicked = output<TableRow>();

  readonly hasActions = () => this.showActions();

  onRowClick(row: TableRow): void {
    this.rowClicked.emit(row);
  }

  onEdit(row: TableRow): void {
    this.editClicked.emit(row);
  }

  onDelete(row: TableRow): void {
    this.deleteClicked.emit(row);
  }
}
