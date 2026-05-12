import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <h1>Panel de Administración</h1>
      <p>Bienvenido al portal administrativo de Notas NUR 3.0</p>
    </div>
  `,
  styles: [`
    .admin-dashboard { padding: 2rem; text-align: center; }
    .admin-dashboard h1 { font-size: 1.75rem; color: var(--text-primary, #1a1a2e); margin-bottom: 0.5rem; }
    .admin-dashboard p { color: var(--text-secondary, #6b7280); }
  `]
})
export class AdminDashboard {}
