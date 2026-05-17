import { Component, input, output, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Requerido para ngTemplateOutlet
import { Button } from '../button/button';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, Button], // Agregamos CommonModule
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table {
  columns = input.required<TableColumn[]>();
  data = input.required<any[]>();

  showActions = input<boolean>(false);

  editClicked = output<any>();
  deleteClicked = output<any>();

  // 💡 EL SECRETO: Captura si pasas un diseño de fila personalizado desde la pestaña de asistencia
  @ContentChild('customRow', { static: false }) customRowTemplate!: TemplateRef<any>;
}