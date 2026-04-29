import { Component, computed, input, output, signal } from '@angular/core';
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
  private static nextId = 0;

  type = input<'text' | 'password' | 'number' | 'date' | 'search' | 'select'>('text');
  label = input<string>('');
  placeholder = input<string>('');
  value = input<string | number>('');
  disabled = input<boolean>(false);
  errorMessage = input<string>('');
  required = input<boolean>(false);
  min = input<number | null>(null);
  max = input<number | null>(null);
  minLength = input<number | null>(null);
  maxLength = input<number | null>(null);
  pattern = input<string>('');
  showErrors = input<boolean>(false);

  options = input<SelectOption[]>([]);

  valueChange = output<string | number>();

  touched = signal(false);
  showPassword = signal(false);

  readonly controlId = `app-input-${Input.nextId++}`;
  readonly errorId = `${this.controlId}-error`;

  readonly effectiveType = computed(() => {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  });

  readonly internalErrorMessage = computed(() => this.getInternalErrorMessage(this.value()));
  readonly displayErrorMessage = computed(() => {
    const externalError = this.errorMessage().trim();

    if (externalError) {
      return externalError;
    }

    if (!this.shouldShowInternalErrors()) {
      return '';
    }

    return this.internalErrorMessage();
  });
  readonly hasError = computed(() => Boolean(this.displayErrorMessage()));

  onChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const emitValue = this.normalizeOutputValue(target.value);
    this.valueChange.emit(emitValue);
  }

  onBlur() {
    this.touched.set(true);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  supportsLengthValidation() {
    return this.type() === 'text' || this.type() === 'password' || this.type() === 'search';
  }

  private shouldShowInternalErrors() {
    return this.showErrors() || this.touched();
  }

  private normalizeOutputValue(rawValue: string) {
    if (this.type() !== 'number') {
      return rawValue;
    }

    if (rawValue.trim() === '') {
      return '';
    }

    return Number(rawValue);
  }

  private getInternalErrorMessage(value: string | number) {
    const isEmpty = this.isEmptyValue(value);

    if (this.required() && isEmpty) {
      return 'Este campo es obligatorio.';
    }

    if (isEmpty) {
      return '';
    }

    return (
      this.getNumberValidationError(value) ||
      this.getLengthValidationError(value) ||
      this.getPatternValidationError(value)
    );
  }

  private isEmptyValue(value: string | number) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  private getNumberValidationError(value: string | number) {
    if (this.type() !== 'number') {
      return '';
    }

    const numericValue = typeof value === 'number' ? value : Number(value);

    if (Number.isNaN(numericValue)) {
      return 'Ingresa un número válido.';
    }

    const min = this.min();
    const max = this.max();

    if (min !== null && numericValue < min) {
      return `El valor mínimo es ${min}.`;
    }

    if (max !== null && numericValue > max) {
      return `El valor máximo es ${max}.`;
    }

    return '';
  }

  private getLengthValidationError(value: string | number) {
    if (!this.supportsLengthValidation()) {
      return '';
    }

    const stringValue = String(value);
    const minLength = this.minLength();
    const maxLength = this.maxLength();

    if (minLength !== null && stringValue.length < minLength) {
      return `Debe tener al menos ${minLength} caracteres.`;
    }

    if (maxLength !== null && stringValue.length > maxLength) {
      return `Debe tener máximo ${maxLength} caracteres.`;
    }

    return '';
  }

  private getPatternValidationError(value: string | number) {
    const pattern = this.pattern().trim();

    if (!pattern) {
      return '';
    }

    try {
      const regex = new RegExp(pattern);

      if (!regex.test(String(value))) {
        return 'El formato ingresado no es válido.';
      }
    } catch {
      return 'Patrón de validación inválido.';
    }

    return '';
  }
}