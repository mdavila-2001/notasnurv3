import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from "../services/auth";
import { Modal } from "../../shared/components/modal/modal";
import { Button } from "../../shared/components/button/button";

interface MenuItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule, Modal, Button],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(Auth);

  userRole = signal<string>('');
  userName = signal<string>('Usuario');
  
  userRoleDisplay = computed(() => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrador',
      'TEACHER': 'Docente',
      'STUDENT': 'Estudiante'
    };
    return roleMap[this.userRole()] || 'Universitario';
  });
  menuItems = signal<MenuItem[]>([]);
  isLogoutModalOpen = signal<boolean>(false);

  ngOnInit() {
    const role = localStorage.getItem('role') || '';
    const fullName = localStorage.getItem('fullName') || 'Usuario Desconocido';

    this.userRole.set(role);
    this.userName.set(fullName);

    this.buildMenu(role);
  }

  private buildMenu(role: string) {
    if (role === 'ADMIN') {
      this.menuItems.set([
        { path: '/admin/dashboard', icon: 'dashboard', label: 'Gestión Académica' },
        { path: '/admin/subjects', icon: 'auto_stories', label: 'Catálogo de Materias' },
        
        { path: '/admin/usuarios', icon: 'manage_accounts', label: 'Directorio Usuarios' },
        
        { path: '/admin/enrollments', icon: 'school', label:'Matrículas' },
        { path: '/admin/reports', icon: 'analytics', label: 'Reportes y Actas' },
        { path: '/settings', icon: 'settings', label: 'Configuración' }
      ]);
    } else if (role === 'TEACHER') {
      this.menuItems.set([
        { path: '/teacher/dashboard', icon: 'dashboard', label: 'Inicio' }, // Agregado por seguridad
        { path: '/teacher/subjects', icon: 'class', label: 'Mis Materias' },
        { path: '/teacher/attendance', icon: 'assignment_late', label: 'Reportes de Faltas' },
        { path: '/teacher/actas', icon: 'task_alt', label: 'Cierre de Actas' },
        { path: '/settings', icon: 'settings', label: 'Configuración' }
      ]);
    } else if (role === 'STUDENT') {
      this.menuItems.set([
        { path: '/student/dashboard', icon: 'dashboard', label: 'Inicio' },
        { path: '/student/subjects', icon: 'auto_stories', label: 'Mis Materias' },
        { path: '/student/attendance', icon: 'assignment_late', label: 'Asistencia' },
        { path: '/student/schedule', icon: 'calendar_today', label: 'Horario de Clases' },
        { path: '/settings', icon: 'settings', label: 'Configuración' }
      ]);
    }
  }
  getRoleDisplayName(): string {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Portal Administrador',
      'TEACHER': 'Portal Docente',
      'STUDENT': 'Portal Estudiante'
    };
    return roleMap[this.userRole()] || 'Portal Universitario';
  }

  openLogoutModal() {
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal() {
    this.isLogoutModalOpen.set(false);
  }

  confirmLogout() {
    const logoutResult = this.authService.logout();
    if (logoutResult && typeof logoutResult.subscribe === 'function') {
      logoutResult.subscribe({
        next: () => this.router.navigate(['/login']),
        error: () => this.router.navigate(['/login'])
      });
    } else {
      this.router.navigate(['/login']);
    }
  }
}
