import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">Panel de Control</h1>
        <p class="page-subtitle">Bienvenido(a), {{ userName }} ({{ userRole }})</p>
      </div>

      <div class="page-content">
        <div style="display: flex; flex-direction: column; gap: var(--spacing-normal); align-items: start;">
          <p>Esta es una página de ejemplo para demostrar que la nueva estructura y configuración encaja perfectamente dentro del Layout general.</p>
        </div>
      </div>
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
}
