import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from "../services/auth.service";
import { AcademicManagementService } from "../services/academic-management/academic-management.service";
import { Semester } from "../models/academic-management.model";
import { Modal } from "../../shared/components/modal/modal";
import { Button } from "../../shared/components/button/button";

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterModule, Modal, Button],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly academicService = inject(AcademicManagementService);

  userRole = signal<string>('');
  userName = signal<string>('Usuario');
  isLogoutModalOpen = signal<boolean>(false);
  isSidebarOpen = signal<boolean>(false);

  private allSemesters = signal<Semester[]>([]);

  currentPeriod = computed<{ label: string; isVacation: boolean } | null>(() => {
    const semesters = this.allSemesters();
    if (!semesters.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = semesters.find(s => {
      const start = new Date(s.startDate + 'T00:00:00');
      const end   = new Date(s.endDate   + 'T23:59:59');
      return today >= start && today <= end;
    });

    if (active) {
      return { label: `${active.managementYear}-${active.number}`, isVacation: false };
    }
    return { label: 'Vacaciones', isVacation: true };
  });

  userRoleDisplay = computed(() => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrador',
      'TEACHER': 'Docente',
      'STUDENT': 'Estudiante'
    };
    return roleMap[this.userRole()] || 'Universitario';
  });

  menuItems = signal<MenuItem[]>([]);

  ngOnInit() {
    const cachedRole = this.authService.getUserRole() || '';
    const cachedName = this.authService.getUserFullName() || 'Cargando...';
    this.userRole.set(cachedRole);
    this.userName.set(cachedName);
    this.buildMenu(cachedRole);

    this.authService.getCurrentUserProfile().subscribe({
      next: (response) => {
        const profile = response.data;
        this.userName.set(profile.fullName);
        this.userRole.set(profile.role);
        this.buildMenu(profile.role);
      },
      error: (err) => console.error('[Layout] Error al obtener perfil de usuario:', err)
    });

    this.academicService.getSemesters().subscribe({
      next: (semesters) => this.allSemesters.set(semesters),
      error: () => {}
    });
  }

  private buildMenu(role: string) {
    if (role === 'ADMIN') {
      this.menuItems.set([
        { path: '/admin/dashboard', icon: 'dashboard', label: 'Panel' },
        { path: '/admin/managements', icon: 'calendar_month', label: 'Gestiones' },
        { path: '/admin/semesters', icon: 'date_range', label: 'Semestres' },
        { path: '/admin/faculties', icon: 'corporate_fare', label: 'Facultades' },
        { path: '/admin/degrees', icon: 'school', label: 'Carreras' },
        { path: '/admin/subjects', icon: 'auto_stories', label: 'Catálogo de Materias' },
        { path: '/admin/users', icon: 'manage_accounts', label: 'Directorio Usuarios' },
        { path: '/admin/enrollments', icon: 'how_to_reg', label: 'Matrículas' },
        { path: '/admin/reports', icon: 'analytics', label: 'Reportes y Actas' },
        { path: '/settings', icon: 'settings', label: 'Configuración' }
      ]);
    } else if (role === 'TEACHER') {
      this.menuItems.set([
        { path: '/teacher/dashboard', icon: 'dashboard', label: 'Inicio' },
        { path: '/teacher/subjects', icon: 'class', label: 'Mis Materias' },
        { path: '/teacher/attendance-reports', icon: 'assignment_late', label: 'Reportes de Faltas' },
        { path: '/teacher/grade-closing', icon: 'task_alt', label: 'Cierre de Actas' },
        { path: '/settings', icon: 'settings', label: 'Configuración' }
      ]);
    } else if (role === 'STUDENT') {
      this.menuItems.set([
        { path: '/student/dashboard', icon: 'dashboard', label: 'Inicio' },
        { path: '/student/subjects', icon: 'auto_stories', label: 'Mis Materias' },
        { path: '/student/attendance', icon: 'assignment_late', label: 'Asistencia' },
        // Oculto temporalmente: { path: '/student/schedule', icon: 'calendar_today', label: 'Horario de Clases' },
        { path: '/settings', icon: 'settings', label: 'Configuración' }
      ]);
    }
  }

  readonly roleDisplayName = computed(() => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Portal Administrador',
      'TEACHER': 'Portal Docente',
      'STUDENT': 'Portal Estudiante'
    };
    return roleMap[this.userRole()] || 'Portal Universitario';
  });

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  openLogoutModal() {
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal() {
    this.isLogoutModalOpen.set(false);
  }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
