import { Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../shared/components/button/button';
import { Input } from '../../../shared/components/input/input';
import { DegreeResponse, DegreeRequest } from '../../../features/admin/services/admin-degree.service';
import { FacultyResponse } from '../../../features/admin/services/admin-faculty.service';

@Component({
  selector: 'app-degree-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './degree-form.html',
  styleUrl: './degree-form.css',
})
export class DegreeFormComponent {
  degree = input<DegreeResponse | null>(null);
  faculties = input<FacultyResponse[]>([]);

  save = output<DegreeRequest>();
  cancel = output<void>();

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    code: new FormControl('', [Validators.required, Validators.maxLength(20)]),
    facultyId: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor() {
    effect(() => {
      const d = this.degree();
      this.form.reset({
        name: d?.name ?? '',
        code: d?.code ?? '',
        facultyId: d?.facultyId ?? null,
      });
    });
  }

  get nameControl() { return this.form.controls.name; }
  get codeControl() { return this.form.controls.code; }
  get facultyControl() { return this.form.controls.facultyId; }

  get nameError() {
    if (!this.nameControl.touched) return '';
    if (this.nameControl.hasError('required')) return 'El nombre es obligatorio.';
    if (this.nameControl.hasError('maxlength')) return 'Máximo 100 caracteres.';
    return '';
  }

  get codeError() {
    if (!this.codeControl.touched) return '';
    if (this.codeControl.hasError('required')) return 'El código es obligatorio.';
    if (this.codeControl.hasError('maxlength')) return 'Máximo 20 caracteres.';
    return '';
  }

  get facultyError() {
    if (!this.facultyControl.touched) return '';
    if (this.facultyControl.hasError('required')) return 'Selecciona una facultad.';
    return '';
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.save.emit({
      name: this.nameControl.value!.trim(),
      code: this.codeControl.value!.trim().toUpperCase(),
      facultyId: this.facultyControl.value!,
    });
  }

  onCancel() { this.cancel.emit(); }
}
