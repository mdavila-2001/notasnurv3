import { Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../shared/components/button/button';
import { Input } from '../../../shared/components/input/input';
import { FacultyResponse, FacultyRequest } from '../../../features/admin/services/admin-faculty.service';

@Component({
  selector: 'app-faculty-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './faculty-form.html',
  styleUrl: './faculty-form.css',
})
export class FacultyFormComponent {
  faculty = input<FacultyResponse | null>(null);

  save = output<FacultyRequest>();
  cancel = output<void>();

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    code: new FormControl('', [Validators.required, Validators.maxLength(20)]),
  });

  constructor() {
    effect(() => {
      const f = this.faculty();
      this.form.reset({ name: f?.name ?? '', code: f?.code ?? '' });
    });
  }

  get nameControl() { return this.form.controls.name; }
  get codeControl() { return this.form.controls.code; }

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

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.save.emit({
      name: this.nameControl.value!.trim(),
      code: this.codeControl.value!.trim().toUpperCase(),
    });
  }

  onCancel() { this.cancel.emit(); }
}
