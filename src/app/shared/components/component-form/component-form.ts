import { Component, computed, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Modal } from '../modal/modal';
import { Input } from '../input/input';
import { Button } from '../button/button';

export interface ComponentFormValue {
  name: string;
  weight: number;
  description?: string;
  planId: number;
}

@Component({
  selector: 'app-component-form',
  standalone: true,
  imports: [ReactiveFormsModule, Modal, Input, Button],
  templateUrl: './component-form.html',
  styles: [
    `
      .form-grid {
        display: grid;
        gap: 1rem;
      }

      .hint-text {
        margin: 0;
        font-size: 0.85rem;
        color: #6b7280;
      }
    `,
  ],
})
export class ComponentFormComponent {
  readonly isOpen = input<boolean>(false);
  readonly planId = input.required<number>();

  readonly save = output<ComponentFormValue>();
  readonly closed = output<void>();

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    weight: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
    description: new FormControl('', { nonNullable: true }),
  });

  private readonly formValidSignal = toSignal(
    this.form.statusChanges.pipe(
      startWith(this.form.status),
      map(() => this.form.valid),
    ),
    { initialValue: this.form.valid },
  );

  readonly canSave = computed(() => this.formValidSignal());

  onNameChange(value: string | number) {
    if (typeof value === 'string') {
      this.form.controls.name.setValue(value);
    }
  }

  onWeightChange(value: string | number) {
    if (typeof value === 'number') {
      this.form.controls.weight.setValue(value);
      return;
    }

    this.form.controls.weight.setValue(null);
  }

  onDescriptionChange(value: string | number) {
    if (typeof value === 'string') {
      this.form.controls.description.setValue(value);
    }
  }

  onSubmit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, weight, description } = this.form.getRawValue();

    if (weight === null) {
      return;
    }

    this.save.emit({
      name: name.trim(),
      weight,
      description: description.trim() || undefined,
      planId: this.planId(),
    });

    this.form.reset({ name: '', weight: null, description: '' });
  }

  onClose() {
    this.form.reset({ name: '', weight: null, description: '' });
    this.closed.emit();
  }
}
