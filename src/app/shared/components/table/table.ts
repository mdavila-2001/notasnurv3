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
  data = input.required<any[]>();

  showActions = input<boolean>(false);
  showEditAction = input<boolean>(true);
  showDeleteAction = input<boolean>(false);

  @ContentChild('customRow') customRowTemplate?: TemplateRef<CustomRowContext<TableRow>>;

  rowClicked = output<any>();
  editClicked = output<any>();
  deleteClicked = output<any>();

  readonly hasActions = () => this.showActions() || this.showEditAction() || this.showDeleteAction();

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
