import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
})
export class Input {
  type = input<'text' | 'number' | 'date' | 'search' | 'select'>('text');
  label = input<string>('');
  placeholder = input<string>('');
  value = input<string | number>('');
  disabled = input<boolean>(false);
  errorMessage = input<string>('');

  options = input<SelectOption[]>([]);

  valueChange = output<string | number>();

  onChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    // Si es tipo número, podemos emitirlo como número directamente para evitar bugs de tipos
    const emitValue = this.type() === 'number' ? Number(target.value) : target.value;
    this.valueChange.emit(emitValue);
  }
}