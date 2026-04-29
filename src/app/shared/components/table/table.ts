import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '../button/button';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table {
  columns = input.required<TableColumn[]>();
  data = input.required<any[]>();

  showActions = input<boolean>(false);

  editClicked = output<any>();
  deleteClicked = output<any>();
}
