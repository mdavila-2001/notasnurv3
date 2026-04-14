import { Component, OnInit, inject } from '@angular/core';
import { GestionAcademicaService } from '../core/services/gestion-academica.service';

@Component({
  selector: 'app-gestion-academica-smoke',
  standalone: true,
  template: '',
})
export class GestionAcademicaSmokeComponent implements OnInit {
  private readonly gestionAcademicaService = inject(GestionAcademicaService);

  ngOnInit(): void {
    this.gestionAcademicaService.getManagements().subscribe({
      next: (managements) => {
        console.log('[US-02 Smoke] Gestiones obtenidas:', managements);
      },
      error: (error) => {
        console.error('[US-02 Smoke] Error al obtener gestiones:', error);
      },
    });
  }
}
