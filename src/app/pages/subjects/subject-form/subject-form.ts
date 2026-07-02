import { Component, effect, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Input, SelectOption } from '../../../shared/components/input/input';
import { Button } from '../../../shared/components/button/button';
import {
  SubjectModality,
  SubjectRecordStatus,
  SubjectRequest,
  SubjectResponse,
} from '../../../core/models/subject.model';

type SubjectStatusOption = Omit<SelectOption, 'value'> & { value: SubjectRecordStatus };

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Input, Button],
  templateUrl: './subject-form.html',
  styleUrl: './subject-form.css',
})
export class SubjectFormComponent {
  subject = input<SubjectResponse | null>(null);

  semesterOptions = input<SelectOption[]>([]);
  teacherOptions = input<SelectOption[]>([]);

  save = output<SubjectRequest>();
  cancel = output<void>();

  form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modality: new FormControl<SubjectModality | ''>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    capacity: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    semesterId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    teacherId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    recordStatus: new FormControl<SubjectRecordStatus>('DRAFT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly modalityOptions: SelectOption[] = [
    { label: 'Presencial', value: 'FACE_TO_FACE' },
    { label: 'Semi-presencial', value: 'BLENDED' },
    { label: 'Virtual', value: 'ONLINE' },
  ];

  readonly statusOptions: SubjectStatusOption[] = [
    { label: 'Borrador', value: 'DRAFT' },
    { label: 'Publicada', value: 'PUBLISHED' },
    { label: 'Activa', value: 'ACTIVE' },
    { label: 'Inactiva', value: 'INACTIVE' },
    { label: 'Cerrada', value: 'CLOSED' },
  ];

  constructor() {
    effect(() => {
      const current = this.subject();
      this.form.reset({
        code: current?.code ?? '',
        name: current?.name ?? '',
        modality: (current?.modality as SubjectModality | '') ?? '',
        capacity: current?.capacity ?? null,
        semesterId: current?.semesterId ? String(current.semesterId) : '',
        teacherId: current?.teacherId ?? '',
        recordStatus: current?.recordStatus ?? 'DRAFT', 
      });
      if (current) {
        this.form.controls.code.disable();
      } else {
        this.form.controls.code.enable();
      }
    });
  }

  get isEditing() { return this.subject() !== null; }
  get codeControl() { return this.form.controls.code; }
  get nameControl() { return this.form.controls.name; }
  get modalityControl() { return this.form.controls.modality; }
  get capacityControl() { return this.form.controls.capacity; }
  get semesterIdControl() { return this.form.controls.semesterId; }
  get teacherIdControl() { return this.form.controls.teacherId; }
  get recordStatusControl() { return this.form.controls.recordStatus; }

  onCodeChange(value: string | number) {
    this.codeControl.setValue(String(value));
    this.codeControl.markAsTouched();
  }

  onNameChange(value: string | number) {
    this.nameControl.setValue(String(value));
    this.nameControl.markAsTouched();
  }

  onModalityChange(value: string | number) {
    this.modalityControl.setValue(value as SubjectModality | '');
    this.modalityControl.markAsTouched();
  }

  onCapacityChange(value: string | number) {
    const num = Number(value);
    this.capacityControl.setValue(isNaN(num) ? null : num);
    this.capacityControl.markAsTouched();
  }

  onSemesterChange(value: string | number) {
    this.semesterIdControl.setValue(String(value));
    this.semesterIdControl.markAsTouched();
  }

  onTeacherChange(value: string | number) {
    this.teacherIdControl.setValue(String(value));
    this.teacherIdControl.markAsTouched();
  }

  onRecordStatusValueChange(value: string | number) {
    const normalizedValue = String(value);

    if (!this.isSubjectRecordStatus(normalizedValue)) return;

    this.onRecordStatusChange(normalizedValue);
  }

  onRecordStatusChange(value: SubjectRecordStatus) {
    this.recordStatusControl.setValue(value);
    this.recordStatusControl.markAsTouched();
  }

  private isSubjectRecordStatus(value: string): value is SubjectRecordStatus {
    return this.statusOptions.some(option => option.value === value);
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    if (!value.modality || value.capacity === null) return;

    this.save.emit({
      code: value.code,
      name: value.name,
      modality: value.modality as SubjectModality,
      capacity: value.capacity,
      semesterId: Number(value.semesterId),
      teacherId: value.teacherId,
      recordStatus: value.recordStatus, 
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}