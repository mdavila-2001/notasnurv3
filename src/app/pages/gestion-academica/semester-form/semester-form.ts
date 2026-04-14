import { Component, computed, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Input, SelectOption } from '../../../shared/components/input/input';
import { Button } from '../../../shared/components/button/button';
import { Management, Semester, SemesterRequest } from '../../../core/models/gestion-academica.model';

const endDateAfterStartDateValidator: ValidatorFn = (control): ValidationErrors | null => {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;

  if (!startDate || !endDate) {
    return null;
  }

  return new Date(endDate) > new Date(startDate)
    ? null
    : { endDateBeforeStartDate: true };
};

@Component({
  selector: 'app-semester-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './semester-form.html',
  styleUrl: './semester-form.css',
})
export class SemesterFormComponent {
  semester = input<Semester | null>(null);
  managements = input<Management[]>([]);

  save = output<SemesterRequest>();
  cancel = output<void>();

  form = new FormGroup(
    {
      managementId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      number: new FormControl<1 | 2 | null>(null, { validators: [Validators.required] }),
      startDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      endDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [endDateAfterStartDateValidator] }
  );

  readonly managementOptions = computed<SelectOption[]>(() =>
    this.managements().map((item) => ({ label: String(item.year), value: item.id }))
  );

  readonly numberOptions: SelectOption[] = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
  ];

  constructor() {
    effect(() => {
      const current = this.semester();
      this.form.reset({
        managementId: current?.managementId ?? '',
        number: current?.number ?? null,
        startDate: current?.startDate?.slice(0, 10) ?? '',
        endDate: current?.endDate?.slice(0, 10) ?? '',
      });
    });
  }

  get managementIdControl() {
    return this.form.controls.managementId;
  }

  get numberControl() {
    return this.form.controls.number;
  }

  get startDateControl() {
    return this.form.controls.startDate;
  }

  get endDateControl() {
    return this.form.controls.endDate;
  }

  get dateRangeErrorMessage() {
    if (!this.form.hasError('endDateBeforeStartDate')) {
      return '';
    }

    if (!(this.endDateControl.touched || this.startDateControl.touched)) {
      return '';
    }

    return 'La fecha fin debe ser posterior a la fecha inicio.';
  }

  getRequiredMessage(control: FormControl<any>, label: string) {
    if (!control.touched && !control.dirty) {
      return '';
    }

    return control.hasError('required') ? `${label} es obligatorio.` : '';
  }

  onManagementChange(value: string | number) {
    this.managementIdControl.setValue(String(value));
    this.managementIdControl.markAsTouched();
  }

  onNumberChange(value: string | number) {
    if (value === '') {
      this.numberControl.setValue(null);
      this.numberControl.markAsTouched();
      return;
    }

    const parsed = Number(value) as 1 | 2;
    this.numberControl.setValue(parsed);
    this.numberControl.markAsTouched();
  }

  onStartDateChange(value: string | number) {
    this.startDateControl.setValue(String(value));
    this.startDateControl.markAsTouched();
    this.endDateControl.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  onEndDateChange(value: string | number) {
    this.endDateControl.setValue(String(value));
    this.endDateControl.markAsTouched();
    this.form.updateValueAndValidity();
  }

  onSubmit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    if (!value.number) {
      return;
    }

    this.save.emit({
      managementId: value.managementId,
      number: value.number,
      startDate: value.startDate,
      endDate: value.endDate,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
