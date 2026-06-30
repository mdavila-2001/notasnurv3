import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Button } from '../button/button';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [Button],
  templateUrl: './under-construction.html',
  styleUrl: './under-construction.css',
})
export class UnderConstruction implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  featureName = signal<string>('Módulo Académico');
  featureIcon = signal<string>('construction');
  featureDescription = signal<string>(
    'Estamos trabajando arduamente en el desarrollo de esta funcionalidad para el próximo sprint final.'
  );

  ngOnInit() {
    const url = this.router.url;

    if (url.includes('attendance')) {
      this.featureName.set('Control y Reporte de Asistencia');
      this.featureIcon.set('assignment_turned_in');
      this.featureDescription.set(
        'El módulo para el registro detallado de inasistencias y alarmas de presencialidad estará disponible muy pronto.'
      );
    } else if (url.includes('actas') || url.includes('reports')) {
      this.featureName.set('Cierre de Actas y Reportes');
      this.featureIcon.set('analytics');
      this.featureDescription.set(
        'Aquí se centralizará la generación de reportes consolidados oficiales y el firmado digital para el bloqueo de actas.'
      );
    } else if (url.includes('schedule')) {
      this.featureName.set('Horario de Clases y Calendario');
      this.featureIcon.set('calendar_today');
      this.featureDescription.set(
        'Visualización de aulas, asignaciones de semestres y calendario académico integrado.'
      );
    }
  }

  goBack() {
    const role = this.authService.getUserRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'TEACHER') {
      this.router.navigate(['/teacher/dashboard']);
    } else if (role === 'STUDENT') {
      this.router.navigate(['/student/subjects']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
