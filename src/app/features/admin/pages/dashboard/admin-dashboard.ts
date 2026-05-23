import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminDashboardSummary } from '../../../../core/models/admin-dashboard.model';
import { Button } from '../../../../shared/components/button/button';
import { Loader } from '../../../../shared/components/loader/loader';
import { ToastService } from '../../../../shared/services/toast.service';
import { AdminDashboardService } from '../../services/admin-dashboard.service';

interface DashboardMetricCard {
  title: string;
  value: string;
  helper: string;
  status: string;
  icon: string;
  variant: 'students' | 'subjects' | 'actas' | 'approved' | 'failed' | 'risk';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Loader, Button],
  template: `
    <section class="admin-dashboard">
      <header class="dashboard-hero">
        <div class="hero-copy">
          <span class="eyebrow">Reportes globales</span>
          <h1>Dashboard Gerencial</h1>
          <p>
            Vista ejecutiva del rendimiento académico y operación institucional basada en el
            DashboardController del backend.
          </p>
        </div>

        <div class="hero-actions">

          <app-button variant="secondary" (clicked)="loadDashboard()" [disabled]="isLoading()">
            @if (isLoading()) {
              <app-loader size="sm"></app-loader>
            } @else {
              <span class="button-content">
                <span class="material-symbols-outlined">refresh</span>
                Actualizar
              </span>
            }
          </app-button>
        </div>
      </header>

      @if (isLoading() && !summary()) {
        <div class="dashboard-state">
          <app-loader label="Cargando indicadores gerenciales..." [centered]="true"></app-loader>
        </div>
      } @else if (errorMessage() && !summary()) {
        <div class="dashboard-state dashboard-state--error">
          <span class="material-symbols-outlined">error</span>
          <h2>No se pudo cargar el dashboard</h2>
          <p>{{ errorMessage() }}</p>
          <app-button variant="primary" (clicked)="loadDashboard()">Reintentar</app-button>
        </div>
      } @else {
        <div class="metrics-grid" aria-label="Indicadores principales">
          @for (card of dashboardCards(); track card.title) {
            <article class="metric-card" [class]="'metric-card metric-card--' + card.variant">
              <div class="metric-topline">
                <span>{{ card.title }}</span>
                <span class="material-symbols-outlined">{{ card.icon }}</span>
              </div>

              <strong>{{ card.value }}</strong>
              <p>{{ card.helper }}</p>

              <div class="metric-footer">
                <span>{{ card.status }}</span>
              </div>
            </article>
          }
        </div>

        <section class="insight-layout">
          <article class="performance-panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">Índice general</span>
                <h2>Aprobados vs. reprobados</h2>
              </div>
              <span class="status-badge">Gestión actual</span>
            </div>

            <div class="score-row">
              <div>
                <small>Aprobación global</small>
                <strong>{{ formatPercentage(summary()?.globalPassRate ?? 0) }}</strong>
              </div>
              <div>
                <small>Reprobación global</small>
                <strong>{{ formatPercentage(summary()?.globalFailRate ?? 0) }}</strong>
              </div>
            </div>

            <div class="stacked-bar" aria-label="Distribución de aprobación y reprobación">
              <span class="stacked-bar__approved" [style.width.%]="summary()?.globalPassRate ?? 0"></span>
              <span class="stacked-bar__failed" [style.width.%]="summary()?.globalFailRate ?? 0"></span>
            </div>

            <div class="legend-row">
              <span><i class="legend-dot legend-dot--approved"></i>Aprobados</span>
              <span><i class="legend-dot legend-dot--failed"></i>Reprobados</span>
              <strong>{{ formatInteger(summary()?.totalStudents ?? 0) }} estudiantes</strong>
            </div>
          </article>

          <article class="quality-panel">
            <div class="panel-header panel-header--compact">
              <div>
                <span class="eyebrow">Alertas de calidad</span>
                <h2>Seguimiento académico</h2>
              </div>
              <span class="material-symbols-outlined info-icon">info</span>
            </div>

            <div class="quality-list">
              <div class="quality-item quality-item--approved">
                <span class="material-symbols-outlined">trending_up</span>
                <div>
                  <strong>{{ formatPercentage(summary()?.globalPassRate ?? 0) }} de aprobación global</strong>
                  <small>Indicador positivo del periodo académico.</small>
                </div>
              </div>

              <div class="quality-item quality-item--failed">
                <span class="material-symbols-outlined">priority_high</span>
                <div>
                  <strong>{{ formatInteger(summary()?.studentsAtRiskCount ?? 0) }} estudiantes en riesgo</strong>
                  <small>Requiere análisis de acompañamiento docente.</small>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="management-panel" aria-label="Resumen por gestión">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Resumen por gestión</span>
              <h2>Rendimiento anual</h2>
            </div>
            <span class="status-badge">DashboardController</span>
          </div>

          @if ((summary()?.managements?.length ?? 0) > 0) {
            <div class="management-grid">
              @for (management of summary()?.managements ?? []; track management.id) {
                <article class="management-card">
                  <div>
                    <small>Gestión</small>
                    <strong>{{ management.year }}</strong>
                  </div>
                  <div>
                    <small>Estado</small>
                    <span class="management-status">{{ translateManagementStatus(management.status) }}</span>
                  </div>
                  <div>
                    <small>Estudiantes</small>
                    <strong>{{ formatInteger(management.studentCount) }}</strong>
                  </div>
                  <div>
                    <small>Aprobación</small>
                    <strong>{{ formatPercentage(management.passRate) }}</strong>
                  </div>
                </article>
              }
            </div>
          } @else {
            <p class="empty-managements">No hay gestiones disponibles para mostrar.</p>
          }
        </section>
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .admin-dashboard {
      min-height: 100%;
      padding: clamp(1.25rem, 3vw, 2.5rem);
      color: #061626;
      animation: fadeIn 0.25s ease-out;
    }

    .dashboard-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 1.75rem;
    }

    .hero-copy {
      max-width: 48rem;
    }

    .eyebrow {
      display: inline-block;
      color: #013a52;
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 0.55rem;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      color: #061626;
      font-size: clamp(2rem, 4vw, 3.25rem);
      font-weight: 400;
      letter-spacing: -0.055em;
      line-height: 1;
    }

    .hero-copy p {
      max-width: 42rem;
      margin-top: 0.85rem;
      color: #5e6875;
      font-size: 1rem;
      line-height: 1.55;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .refresh-pill {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.8rem 1rem;
      border: 1px solid rgba(0, 33, 49, 0.08);
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 18px 40px rgba(0, 33, 49, 0.05);
    }

    .refresh-pill > span {
      color: #00a8e8;
    }

    .refresh-pill small {
      display: block;
      color: #7a828d;
      font-size: 0.72rem;
      margin-bottom: 0.15rem;
    }

    .refresh-pill strong {
      color: #061626;
      font-size: 0.86rem;
    }

    .button-content {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }

    .button-content .material-symbols-outlined {
      font-size: 1.15rem;
    }

    .dashboard-state {
      min-height: 18rem;
      display: grid;
      place-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
      border-radius: 1.25rem;
      background: #ffffff;
      border: 1px solid rgba(0, 33, 49, 0.08);
      box-shadow: 0 18px 48px rgba(0, 33, 49, 0.05);
    }

    .dashboard-state--error {
      place-items: center;
    }

    .dashboard-state--error > .material-symbols-outlined {
      color: #dc2626;
      font-size: 3rem;
    }

    .dashboard-state h2 {
      color: #061626;
      font-size: 1.4rem;
    }

    .dashboard-state p {
      color: #5e6875;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (min-width: 720px) {
      .metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1180px) {
      .metrics-grid {
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      }
    }

    .metric-card {
      min-height: 9.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 1rem;
      background: #ffffff;
      border: 1px solid rgba(0, 33, 49, 0.08);
      box-shadow: 0 18px 48px rgba(0, 33, 49, 0.05);
      position: relative;
      overflow: hidden;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 0.28rem;
      background: #00a8e8;
      opacity: 0;
    }

    .metric-card--students::before,
    .metric-card--subjects::before,
    .metric-card--actas::before,
    .metric-card--approved::before,
    .metric-card--risk::before {
      opacity: 1;
    }

    .metric-card--failed {
      color: #ffffff;
      background: #002d3f;
      border-color: #002d3f;
      box-shadow: 0 22px 50px rgba(0, 45, 63, 0.22);
    }

    .metric-card--failed::before {
      opacity: 1;
      background: #00a8e8;
    }

    .metric-topline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      color: #061626;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .metric-card--failed .metric-topline,
    .metric-card--failed p,
    .metric-card--failed .metric-footer {
      color: rgba(255, 255, 255, 0.78);
    }

    .metric-topline .material-symbols-outlined {
      color: #6b7280;
      font-size: 1.35rem;
    }

    .metric-card--failed .metric-topline .material-symbols-outlined {
      color: #6ee7ff;
    }

    .metric-card strong {
      display: block;
      color: #061626;
      font-size: clamp(2rem, 4vw, 2.85rem);
      font-weight: 400;
      letter-spacing: -0.06em;
      line-height: 0.95;
    }

    .metric-card--failed strong {
      color: #ffffff;
    }

    .metric-card p {
      color: #66717d;
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .metric-footer {
      width: fit-content;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      background: #e7f7ff;
      color: #00658f;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .metric-card--failed .metric-footer {
      background: rgba(0, 168, 232, 0.16);
      color: #9be8ff;
    }

    .insight-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
    }

    @media (min-width: 1100px) {
      .insight-layout {
        grid-template-columns: minmax(0, 1.35fr) minmax(22rem, 0.65fr);
      }
    }

    .performance-panel,
    .quality-panel,
    .management-panel {
      padding: clamp(1.25rem, 3vw, 2rem);
      border-radius: 1.35rem;
      background: #ffffff;
      border: 1px solid rgba(0, 33, 49, 0.08);
      box-shadow: 0 18px 48px rgba(0, 33, 49, 0.05);
    }

    .performance-panel {
      background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .panel-header--compact {
      margin-bottom: 1.25rem;
    }

    .panel-header h2 {
      color: #061626;
      font-size: clamp(1.45rem, 3vw, 2rem);
      font-weight: 500;
      letter-spacing: -0.035em;
    }

    .status-badge {
      align-self: center;
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      background: #d7e7ff;
      color: #003f8f;
      font-size: 0.78rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .score-row {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    @media (min-width: 640px) {
      .score-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .score-row div {
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(0, 33, 49, 0.07);
    }

    .score-row small {
      display: block;
      color: #6f7782;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 0.45rem;
    }

    .score-row strong {
      color: #061626;
      font-size: 2.25rem;
      font-weight: 400;
      letter-spacing: -0.05em;
    }

    .stacked-bar {
      display: flex;
      width: 100%;
      height: 0.8rem;
      overflow: hidden;
      border-radius: 999px;
      background: #e5e7eb;
      margin-bottom: 0.9rem;
    }

    .stacked-bar span {
      height: 100%;
      transition: width 0.3s ease;
    }

    .stacked-bar__approved {
      background: #00a8e8;
    }

    .stacked-bar__failed {
      background: #f59e0b;
    }

    .legend-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.75rem 1.5rem;
      color: #66717d;
      font-size: 0.9rem;
    }

    .legend-row span {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }

    .legend-row strong {
      color: #061626;
    }

    .legend-dot {
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 999px;
    }

    .legend-dot--approved {
      background: #00a8e8;
    }

    .legend-dot--failed {
      background: #f59e0b;
    }

    .info-icon {
      color: #00a8e8;
    }

    .quality-list {
      display: grid;
      gap: 1rem;
    }

    .quality-item {
      display: flex;
      gap: 0.9rem;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 1rem;
      background: #f8fafc;
    }

    .quality-item > span {
      width: 2.6rem;
      height: 2.6rem;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 999px;
      font-size: 1.35rem;
    }

    .quality-item--approved > span {
      color: #0079ad;
      background: #dff4ff;
    }

    .quality-item--failed > span {
      color: #b45309;
      background: #fef3c7;
    }

    .management-panel {
      margin-top: 1.5rem;
    }

    .management-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 1rem;
    }

    .management-card {
      display: grid;
      gap: 1rem;
      padding: 1.1rem;
      border-radius: 1rem;
      background: #f8fafc;
      border: 1px solid rgba(0, 33, 49, 0.07);
    }

    .management-card small {
      display: block;
      color: #6f7782;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 0.25rem;
    }

    .management-card strong {
      color: #061626;
      font-size: 1.45rem;
      font-weight: 500;
      letter-spacing: -0.03em;
    }

    .management-status {
      display: inline-flex;
      width: fit-content;
      padding: 0.32rem 0.65rem;
      border-radius: 999px;
      background: #e7f7ff;
      color: #00658f;
      font-size: 0.78rem;
      font-weight: 800;
    }

    .empty-managements {
      color: #6f7782;
    }

    .quality-item strong {
      display: block;
      color: #061626;
      margin-bottom: 0.2rem;
    }

    .quality-item small {
      color: #6f7782;
      line-height: 1.4;
    }

    @media (max-width: 760px) {
      .dashboard-hero {
        flex-direction: column;
      }

      .hero-actions,
      .refresh-pill {
        width: 100%;
      }

      .hero-actions {
        justify-content: stretch;
      }
    }
  `],
})
export class AdminDashboard implements OnInit {
  private readonly dashboardService = inject(AdminDashboardService);
  private readonly toastService = inject(ToastService);

  readonly summary = signal<AdminDashboardSummary | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly dashboardCards = computed<DashboardMetricCard[]>(() => {
    const summary = this.summary();
    const totalStudents = summary?.totalStudents ?? 0;
    const totalSubjectsWithoutTeacher = summary?.totalSubjectsWithoutTeacher ?? 0;
    const totalOpenActas = summary?.totalOpenActas ?? 0;
    const globalPassRate = summary?.globalPassRate ?? 0;
    const globalFailRate = summary?.globalFailRate ?? 0;
    const studentsAtRiskCount = summary?.studentsAtRiskCount ?? 0;

    return [
      {
        title: 'Total estudiantes',
        value: this.formatInteger(totalStudents),
        helper: 'Estudiantes registrados en la plataforma.',
        status: 'Base académica',
        icon: 'groups',
        variant: 'students',
      },
      {
        title: 'Materias sin docente',
        value: this.formatInteger(totalSubjectsWithoutTeacher),
        helper: 'Materias pendientes de asignación docente.',
        status: 'Gestión académica',
        icon: 'person_off',
        variant: 'subjects',
      },
      {
        title: 'Actas abiertas',
        value: this.formatInteger(totalOpenActas),
        helper: 'Actas pendientes de cierre académico.',
        status: 'Seguimiento administrativo',
        icon: 'fact_check',
        variant: 'actas',
      },
      {
        title: 'Índice aprobados',
        value: this.formatPercentage(globalPassRate),
        helper: 'Porcentaje global de aprobación institucional.',
        status: 'Rendimiento positivo',
        icon: 'trending_up',
        variant: 'approved',
      },
      {
        title: 'Índice reprobados',
        value: this.formatPercentage(globalFailRate),
        helper: 'Calculado desde el índice global de aprobados.',
        status: 'Seguimiento requerido',
        icon: 'warning',
        variant: 'failed',
      },
      {
        title: 'Estudiantes en riesgo',
        value: this.formatInteger(studentsAtRiskCount),
        helper: 'Estudiantes que requieren acompañamiento académico.',
        status: 'Alerta temprana',
        icon: 'priority_high',
        variant: 'risk',
      },
    ];
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getSummary()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => {
          const message = this.extractErrorMessage(error);
          this.errorMessage.set(message);
          this.toastService.error(message, 'Dashboard');
        },
      });
  }

  formatInteger(value: number): string {
    return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(value);
  }

  formatPercentage(value: number): string {
    return `${new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(this.clampPercentage(value))}%`;
  }

  buildStudentCountDescription(count: number, label: string): string {
    if (count <= 0) {
      return `Sin estudiantes ${label} registrados.`;
    }

    return `${this.formatInteger(count)} estudiantes ${label}.`;
  }

  translateManagementStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      ACTIVE: 'Activa',
      CLOSED: 'Cerrada',
      CONFIGURING: 'Configuración',
    };

    return statusLabels[status] ?? status;
  }

  private clampPercentage(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? 'No se pudo cargar el dashboard gerencial.';
    }
    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo cargar el dashboard gerencial.';
  }
}
