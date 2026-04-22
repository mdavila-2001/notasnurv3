import { Component, effect, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Input, SelectOption } from '../../../shared/components/input/input';
import { Button } from '../../../shared/components/button/button';
import { Subject, SubjectRequest } from '../../../core/models/subject.model';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './subject-form.html',
  styleUrl: './subject-form.css',
})
export class SubjectFormComponent {
  subject = input<Subject | null>(null);

  semesterOptions = input<SelectOption[]>([]);
  teacherOptions = input<SelectOption[]>([]);

  save = output<SubjectRequest>();
  cancel = output<void>();

  form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modality: new FormControl<'PRESENCIAL' | 'SEMI_PRESENCIAL' | ''>('', { nonNullable: true, validators: [Validators.required] }),
    semesterId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    teacherId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly modalityOptions: SelectOption[] = [
    { label: 'Presencial', value: 'PRESENCIAL' },
    { label: 'Semi-presencial', value: 'SEMI_PRESENCIAL' },
  ];

  constructor() {
    effect(() => {
      const current = this.subject();
      this.form.reset({
        code: current?.code ?? '',
        name: current?.name ?? '',
        modality: current?.modality ?? '',
        semesterId: current?.semesterId ?? '',
        teacherId: current?.teacherId ?? '',
      });
    });
  }

  get codeControl() { return this.form.controls.code; }
  get nameControl() { return this.form.controls.name; }
  get modalityControl() { return this.form.controls.modality; }
  get semesterIdControl() { return this.form.controls.semesterId; }
  get teacherIdControl() { return this.form.controls.teacherId; }

  onCodeChange(value: string | number) {
    this.codeControl.setValue(String(value));
    this.codeControl.markAsTouched();
  }

  onNameChange(value: string | number) {
    this.nameControl.setValue(String(value));
    this.nameControl.markAsTouched();
  }

  onModalityChange(value: string | number) {
    this.modalityControl.setValue(value as 'PRESENCIAL' | 'SEMI_PRESENCIAL' | '');
    this.modalityControl.markAsTouched();
  }

  onSemesterChange(value: string | number) {
    this.semesterIdControl.setValue(String(value));
    this.semesterIdControl.markAsTouched();
  }

  onTeacherChange(value: string | number) {
    this.teacherIdControl.setValue(String(value));
    this.teacherIdControl.markAsTouched();
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    if (!value.modality) return;

    this.save.emit({
      code: value.code,
      name: value.name,
      modality: value.modality as 'PRESENCIAL' | 'SEMI_PRESENCIAL',
      semesterId: value.semesterId,
      teacherId: value.teacherId,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}

