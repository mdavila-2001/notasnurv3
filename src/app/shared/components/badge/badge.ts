import { Component, computed, input } from '@angular/core';
import { GradeAcademicStatus } from '../../../core/models/grade.models';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class Badge {
  color = input<BadgeVariant | ''>('');
  status = input<GradeAcademicStatus>('PENDIENTE');

  readonly resolvedVariant = computed(() => this.color() || this.getVariant(this.status()));
  readonly badgeLabel = computed(() => this.getLabel(this.status()));

  private getLabel(status: GradeAcademicStatus): string {
    switch (status) {
      case 'APROBADO':
        return 'Aprobado';
      case 'REPROBADO_POR_FALTAS':
        return 'Reprobado por Faltas';
      case 'REPROBADO':
        return 'Reprobado';
      case 'PENDIENTE':
      default:
        return 'Pendiente';
    }
  }

  private getVariant(status: GradeAcademicStatus): BadgeVariant {
    switch (status) {
      case 'APROBADO':
        return 'success';
      case 'REPROBADO':
      case 'REPROBADO_POR_FALTAS':
        return 'danger';
      case 'PENDIENTE':
      default:
        return 'warning';
    }
  }
}