import { Component, inject, OnInit, signal } from '@angular/core';
import { GlobalSettingsService } from '../../../../core/services/settings/global-settings.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Loader } from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-student-subscriptions',
  standalone: true,
  imports: [Loader],
  templateUrl: './student-subscriptions.html',
  styleUrl: './student-subscriptions.css',
})
export class StudentSubscriptions implements OnInit {
  private readonly settingsService = inject(GlobalSettingsService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly emailAlertOnRisk = signal<boolean>(false);

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  private loadSubscriptions(): void {
    this.isLoading.set(true);
    this.settingsService.getStudentSubscriptions().subscribe({
      next: (subs) => {
        this.emailAlertOnRisk.set(!!subs.emailAlertOnRisk);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar la configuración de alertas.');
        this.isLoading.set(false);
      }
    });
  }

  toggleEmailAlerts(): void {
    if (this.isSaving()) return;

    const nextVal = !this.emailAlertOnRisk();
    this.isSaving.set(true);

    this.settingsService.saveStudentSubscriptions({ emailAlertOnRisk: nextVal }).subscribe({
      next: (subs) => {
        this.emailAlertOnRisk.set(!!subs.emailAlertOnRisk);
        this.isSaving.set(false);
        this.toastService.success(
          nextVal 
            ? 'Alertas de inasistencia habilitadas correctamente.' 
            : 'Alertas de inasistencia deshabilitadas.'
        );
      },
      error: (err) => {
        this.toastService.error(err.message || 'Error al guardar la configuración de alertas.');
        this.isSaving.set(false);
      }
    });
  }
}
