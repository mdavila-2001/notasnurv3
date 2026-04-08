import { Component, signal } from '@angular/core';
import { Badge } from '../shared/components/badge/badge';
import { Button } from '../shared/components/button/button';
import { Input, SelectOption } from '../shared/components/input/input';
import { Loader } from '../shared/components/loader/loader';
import { Modal } from '../shared/components/modal/modal';
import { Table, TableColumn } from '../shared/components/table/table';
import { Toast } from '../shared/components/toast/toast';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastState {
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [Badge, Button, Input, Loader, Modal, Table, Toast],
  templateUrl: './test-page.html',
  styleUrl: './test-page.css',
})
export class TestPage {
  lastAction = signal('Sin acciones todavía.');

  textValue = signal('Nota de ejemplo');
  numberValue = signal<number>(8);
  dateValue = signal('2026-04-06');
  searchValue = signal('');
  selectValue = signal<string | number>('1');
  emailValue = signal('');
  scoreValue = signal<string | number>(14);

  readonly selectOptions: SelectOption[] = [
    { label: 'Matemáticas', value: '1' },
    { label: 'Física', value: '2' },
    { label: 'Programación', value: '3' },
  ];

  readonly tableColumns: TableColumn[] = [
    { key: 'materia', label: 'Materia' },
    { key: 'nota', label: 'Nota' },
    { key: 'estado', label: 'Estado' },
  ];

  readonly tableData = signal([
    { id: 1, materia: 'Matemáticas', nota: '9.2', estado: 'Aprobado' },
    { id: 2, materia: 'Física', nota: '7.8', estado: 'Aprobado' },
    { id: 3, materia: 'Química', nota: '5.9', estado: 'Recuperación' },
  ]);

  modalOpen = signal(false);

  toast = signal<ToastState | null>(null);

  openModal() {
    this.modalOpen.set(true);
    this.lastAction.set('Modal abierto.');
  }

  closeModal() {
    this.modalOpen.set(false);
    this.lastAction.set('Modal cerrado.');
  }

  confirmModal() {
    this.modalOpen.set(false);
    this.lastAction.set('Acción confirmada desde el modal.');
    this.showToast('success');
  }

  showToast(type: ToastType) {
    const titleByType: Record<ToastType, string> = {
      success: 'Operación exitosa',
      info: 'Información',
      warning: 'Atención',
      error: 'Error',
    };

    this.toast.set({
      type,
      title: titleByType[type],
      message: `Toast de prueba tipo ${type}.`,
      duration: 3500,
    });
  }

  closeToast() {
    this.toast.set(null);
  }

  onButtonClick(label: string) {
    this.lastAction.set(`Click en botón: ${label}`);
  }

  onEditRow(row: { materia: string }) {
    this.lastAction.set(`Editar fila: ${row.materia}`);
    this.showToast('info');
  }

  onDeleteRow(row: { materia: string }) {
    this.lastAction.set(`Eliminar fila: ${row.materia}`);
    this.showToast('warning');
  }

  onTextChange(value: string | number) {
    this.textValue.set(String(value));
  }

  onNumberChange(value: string | number) {
    this.numberValue.set(Number(value));
  }

  onDateChange(value: string | number) {
    this.dateValue.set(String(value));
  }

  onSearchChange(value: string | number) {
    this.searchValue.set(String(value));
  }

  onSelectChange(value: string | number) {
    this.selectValue.set(value);
  }

  onEmailChange(value: string | number) {
    this.emailValue.set(String(value));
  }

  onScoreChange(value: string | number) {
    this.scoreValue.set(value);
  }
}
