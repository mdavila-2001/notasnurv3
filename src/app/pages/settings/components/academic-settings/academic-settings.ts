import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Input, SelectOption } from '../../../../shared/components/input/input';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';
import { GlobalSettingsResponse } from '../../../../core/models/settings.model';

@Component({
  selector: 'app-academic-settings',
  standalone: true,
  imports: [ReactiveFormsModule, Input, Button, Loader],
  templateUrl: './academic-settings.html',
  styleUrl: './academic-settings.css',
})
export class AcademicSettings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(GlobalSettingsService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly currentSettings = signal<GlobalSettingsResponse | null>(null);

  readonly academicForm = this.fb.group({
    minPassingGrade: [51, [Validators.required, Validators.min(0), Validators.max(100)]],
    roundingType: ['CLASSIC_UP', Validators.required],
    globalGradesDeadline: ['', Validators.required]
  });

  readonly roundingOptions: SelectOption[] = [
    { label: 'Redondeo Clásico (>= 0.5 hacia arriba)', value: 'CLASSIC_UP' },
    { label: 'Truncar a entero sin decimales', value: 'TRUNCATE' },
    { label: 'Mantener un decimal', value: 'ONE_DECIMAL' }
  ];

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getGlobalSettings().subscribe({
      next: (settings) => {
        this.currentSettings.set(settings);
        if (settings.academic) {
          // Format date if needed, usually globalGradesDeadline is a string in YYYY-MM-DD
          let dateStr = settings.academic.globalGradesDeadline || '';
          if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          }
          this.academicForm.patchValue({
            minPassingGrade: settings.academic.minPassingGrade,
            roundingType: settings.academic.roundingType,
            globalGradesDeadline: dateStr
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar la configuración académica.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.academicForm.invalid || !this.currentSettings()) {
      this.academicForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formVal = this.academicForm.value;

    const updatedSettings: GlobalSettingsResponse = {
      ...this.currentSettings()!,
      academic: {
        minPassingGrade: formVal.minPassingGrade ?? 51,
        roundingType: (formVal.roundingType as any) ?? 'CLASSIC_UP',
        globalGradesDeadline: formVal.globalGradesDeadline ?? ''
      }
    };

    this.settingsService.saveGlobalSettings(updatedSettings).subscribe({
      next: (saved) => {
        this.currentSettings.set(saved);
        this.toastService.success('Configuración académica guardada exitosamente.');
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error al guardar la configuración académica.');
        this.isSaving.set(false);
      }
    });
  }

  get minPassingGradeControl() { return this.academicForm.get('minPassingGrade'); }
  get roundingTypeControl() { return this.academicForm.get('roundingType'); }
  get globalGradesDeadlineControl() { return this.academicForm.get('globalGradesDeadline'); }
}
