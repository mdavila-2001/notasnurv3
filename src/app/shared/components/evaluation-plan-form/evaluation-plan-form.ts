import { Component, computed, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Modal } from '../modal/modal';
import { Input } from '../input/input';
import { Button } from '../button/button';

export interface EvaluationPlanFormValue {
  name: string;
  weight: number;
}

@Component({
  selector: 'app-evaluation-plan-form',
  standalone: true,
  imports: [ReactiveFormsModule, Modal, Input, Button],
  templateUrl: './evaluation-plan-form.html',
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
export class EvaluationPlanFormComponent {
  readonly isOpen = input<boolean>(false);
  readonly planId = input<number | null>(null);

  readonly save = output<EvaluationPlanFormValue>();
  readonly closed = output<void>();

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    weight: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
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

  onSubmit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, weight } = this.form.getRawValue();

    if (weight === null) {
      return;
    }

    this.save.emit({
      name: name.trim(),
      weight,
    });

    this.form.reset({ name: '', weight: null });
  }

  onClose() {
    this.form.reset({ name: '', weight: null });
    this.closed.emit();
  }
}
