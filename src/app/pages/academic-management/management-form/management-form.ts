import { Component, computed, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../shared/components/button/button';
import { Input } from '../../../shared/components/input/input';
import { Management, ManagementRequest } from '../../../core/models/academic-management.model';

@Component({
  selector: 'app-management-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './management-form.html',
  styleUrl: './management-form.css',
})
export class ManagementFormComponent {
  management = input<Management | null>(null);
  existingYears = input<number[]>([]);

  save = output<ManagementRequest>();
  cancel = output<void>();

  readonly currentYear = new Date().getFullYear();
  readonly minYear = 2000;
  readonly maxYear = this.currentYear + 10;

  form = new FormGroup({
    year: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(this.minYear),
        Validators.max(this.maxYear),
      ],
    }),
  });

  readonly duplicateError = computed(() => {
    const year = this.form.controls.year.value;
    if (year === null || year === undefined || Number.isNaN(Number(year))) {
      return false;
    }

    const currentEditYear = this.management()?.year;
    if (currentEditYear && currentEditYear === Number(year)) {
      return false;
    }

    return this.existingYears().includes(Number(year));
  });

  constructor() {
    effect(() => {
      const selected = this.management();
      this.form.reset({ year: selected?.year ?? null });
    });
  }

  get yearControl() {
    return this.form.controls.year;
  }

  get yearErrorMessage() {
    if (this.duplicateError()) {
      return 'Ya existe una gestión para ese año.';
    }

    if (!this.yearControl.touched && !this.yearControl.dirty) {
      return '';
    }

    if (this.yearControl.hasError('required')) {
      return 'El año es obligatorio.';
    }

    if (this.yearControl.hasError('min')) {
      return `El año mínimo es ${this.minYear}.`;
    }

    if (this.yearControl.hasError('max')) {
      return `El año máximo es ${this.maxYear}.`;
    }

    return '';
  }

  onYearChange(value: string | number) {
    if (value === '') {
      this.yearControl.setValue(null);
      this.yearControl.markAsTouched();
      return;
    }

    const numericValue = Number(value);
    this.yearControl.setValue(Number.isNaN(numericValue) ? null : numericValue);
    this.yearControl.markAsTouched();
  }

  onSubmit() {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.duplicateError()) {
      return;
    }

    const year = this.yearControl.value;
    if (year === null) {
      return;
    }

    this.save.emit({ year });
  }

  onCancel() {
    this.cancel.emit();
  }
}
