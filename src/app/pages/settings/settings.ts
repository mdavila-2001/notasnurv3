import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserProfileResponse } from '../../core/models/api.models';

// Import standalone sub-components
import { ProfileView } from './components/profile-view/profile-view';
import { SecuritySettings } from './components/security-settings/security-settings';
import { AcademicSettings } from './components/academic-settings/academic-settings';
import { AttendanceSettings } from './components/attendance-settings/attendance-settings';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ProfileView,
    SecuritySettings,
    AcademicSettings,
    AttendanceSettings
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly activeTab = signal<string>('profile');
  readonly profile = signal<UserProfileResponse | null>(null);
  readonly isProfileLoading = signal<boolean>(true);
  readonly isDarkMode = signal<boolean>(false);

  readonly tabs = computed(() => {
    const role = this.profile()?.role;
    const base = [
      { id: 'profile', label: 'Mi Perfil', icon: 'person', desc: 'Datos institucionales' },
      { id: 'preferences', label: 'Preferencias', icon: 'palette', desc: 'Personalizar apariencia' }
    ];
    
    if (role === 'ADMIN') {
      return [
        ...base,
        { id: 'security', label: 'Seguridad', icon: 'security', desc: 'Cambiar contraseña' },
        { id: 'system-academic', label: 'Ajustes Académicos', icon: 'gavel', desc: 'Reglas académicas' },
        { id: 'system-attendance', label: 'Ajustes Asistencia', icon: 'fact_check', desc: 'Límites de faltas' }
      ];
    }
    
    return base;
  });

  ngOnInit(): void {
    this.loadProfile();
    this.initTheme();
  }

  private loadProfile(): void {
    this.isProfileLoading.set(true);
    this.authService.getCurrentUserProfile().subscribe({
      next: (response) => {
        this.profile.set(response.data);
        this.isProfileLoading.set(false);
      },
      error: () => {
        this.toastService.error('No se pudo cargar la información del perfil.');
        this.isProfileLoading.set(false);
      }
    });
  }

  private initTheme(): void {
    const isDark = document.documentElement.classList.contains('dark-theme') || 
                   localStorage.getItem('theme') === 'dark';
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    }
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  toggleDarkMode(): void {
    const current = this.isDarkMode();
    const nextVal = !current;
    this.isDarkMode.set(nextVal);
    
    if (nextVal) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      this.toastService.success('Tema oscuro activado.');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      this.toastService.success('Tema claro activado.');
    }
  }
}
