import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { Button } from '../../shared/components/button/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <div style="padding: 2rem; font-family: var(--font-family, sans-serif); text-align: center; max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <h2>Página de prueba Auth</h2>
      <p style="font-size: 1.25rem; margin: 2rem 0; color: #333;">
        Hola: <strong>{{ userName }} ({{ userRole }})</strong>
      </p>
      <app-button variant="primary" (clicked)="onLogout()">Cerrar sesión de prueba</app-button>
    </div>
  `
})
export class Dashboard implements OnInit {
  userName = '';
  userRole = '';

  private auth = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    this.userName = localStorage.getItem('fullName') || 'Usuario Desconocido';
    this.userRole = localStorage.getItem('role') || 'SIN_ROL';
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
