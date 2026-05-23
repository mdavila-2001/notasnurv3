import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Input } from '../../../../shared/components/input/input';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';
import { GlobalSettingsResponse } from '../../../../core/models/settings.model';

@Component({
  selector: 'app-attendance-settings',
  standalone: true,
  imports: [ReactiveFormsModule, Input, Button, Loader],
  templateUrl: './attendance-settings.html',
  styleUrl: './attendance-settings.css',
})
export class AttendanceSettings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(GlobalSettingsService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly currentSettings = signal<GlobalSettingsResponse | null>(null);

  readonly attendanceForm = this.fb.group({
    maxAbsencesPresencial: [5, [Validators.required, Validators.min(0)]],
    maxAbsencesSemiPresencial: [3, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getGlobalSettings().subscribe({
      next: (settings) => {
        this.currentSettings.set(settings);
        if (settings.attendance) {
          this.attendanceForm.patchValue({
            maxAbsencesPresencial: settings.attendance.maxAbsencesPresencial,
            maxAbsencesSemiPresencial: settings.attendance.maxAbsencesSemiPresencial
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar la configuración de asistencia.');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.attendanceForm.invalid || !this.currentSettings()) {
      this.attendanceForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formVal = this.attendanceForm.value;

    const updatedSettings: GlobalSettingsResponse = {
      ...this.currentSettings()!,
      attendance: {
        maxAbsencesPresencial: formVal.maxAbsencesPresencial ?? 5,
        maxAbsencesSemiPresencial: formVal.maxAbsencesSemiPresencial ?? 3
      }
    };

    this.settingsService.saveGlobalSettings(updatedSettings).subscribe({
      next: (saved) => {
        this.currentSettings.set(saved);
        this.toastService.success('Configuración de asistencia guardada exitosamente.');
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error al guardar la configuración de asistencia.');
        this.isSaving.set(false);
      }
    });
  }

  get maxAbsencesPresencialControl() { return this.attendanceForm.get('maxAbsencesPresencial'); }
  get maxAbsencesSemiPresencialControl() { return this.attendanceForm.get('maxAbsencesSemiPresencial'); }
}
