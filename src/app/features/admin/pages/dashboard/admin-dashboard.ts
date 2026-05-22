import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AdminDashboardSummary } from '../../../../core/models/admin-dashboard.model';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { Loader } from '../../../../shared/components/loader/loader';
import { Button } from '../../../../shared/components/button/button';
import { ToastService } from '../../../../shared/services/toast.service';
import { Table, TableColumn } from '../../../../shared/components/table/table';

interface DashboardCard {
  title: string;
  value: string;
  description: string;
  icon: string;
  accent: 'students' | 'subjects' | 'approved' | 'failed';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Loader, Button, Table],
  template: `
    <section class="admin-dashboard">
      <header class="dashboard-header">
        <div>
          <span class="eyebrow">Panel gerencial</span>
          <h1>Dashboard de Administración</h1>
          <p>Resumen institucional generado desde el DashboardController del backend.</p>
        </div>

        @if (summary()?.generatedAt) {
          <div class="updated-card">
            <span class="material-symbols-outlined">schedule</span>
            <div>
              <small>Última actualización</small>
              <strong>{{ summary()?.generatedAt | date:'dd/MM/yyyy HH:mm' }}</strong>
            </div>
          </div>
        }
      </header>

      @if (isLoading()) {
        <div class="dashboard-state">
          <app-loader label="Cargando dashboard gerencial..." [centered]="true"></app-loader>
        </div>
      } @else if (errorMessage()) {
        <div class="dashboard-state dashboard-state--error">
          <span class="material-symbols-outlined">error</span>
          <h2>No se pudo cargar el dashboard</h2>
          <p>{{ errorMessage() }}</p>
          <app-button variant="primary" (clicked)="loadDashboard()">Reintentar</app-button>
        </div>
      } @else {
        <div class="metrics-grid">
          @for (card of dashboardCards(); track card.title) {
            <article class="metric-card" [class]="'metric-card metric-card--' + card.accent">
              <div class="metric-icon">
                <span class="material-symbols-outlined">{{ card.icon }}</span>
              </div>
              <div>
                <p class="metric-title">{{ card.title }}</p>
                <strong class="metric-value">{{ card.value }}</strong>
                <p class="metric-description">{{ card.description }}</p>
              </div>
            </article>
          }
        </div>

        <section class="approval-panel">
          <div class="approval-copy">
            <span class="eyebrow">Índice general</span>
            <h2>Aprobados vs. reprobados</h2>
            <p>
              Indicadores consolidados para seguimiento gerencial del rendimiento académico.
            </p>
          </div>

          <div class="approval-bars">
            <div class="bar-row">
              <div class="bar-label">
                <span>Aprobados</span>
                <strong>{{ formatPercentage(summary()?.approvedRate ?? 0) }}</strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill bar-fill--approved" [style.width.%]="summary()?.approvedRate ?? 0"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-label">
                <span>Reprobados</span>
                <strong>{{ formatPercentage(summary()?.failedRate ?? 0) }}</strong>
              </div>
              <div class="bar-track">
                <div class="bar-fill bar-fill--failed" [style.width.%]="summary()?.failedRate ?? 0"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="critical-subjects-panel">
          <header class="panel-header">
            <span class="eyebrow">Seguimiento de Riesgo</span>
            <h2>Materias Críticas (Últimas 5)</h2>
            <p>Asignaturas con mayor índice de reprobación en la última gestión.</p>
          </header>

          <app-table 
            [columns]="criticalColumns()" 
            [data]="summary()?.criticalSubjects ?? []">
            
            <ng-template #customRow let-row let-i="index">
              <tr class="table-row">
                <td class="code-cell"><code>{{ row.code }}</code></td>
                <td class="name-cell"><strong>{{ row.name }}</strong></td>
                <td>{{ row.teacherName }}</td>
                <td class="rate-cell">
                  <span class="rate-badge" [class.rate-badge--high]="row.failureRate >= 40">
                    {{ row.failureRate }}%
                  </span>
                </td>
                <td>
                  <span class="status-indicator" [class]="'status-indicator--' + row.status.toLowerCase()">
                    {{ row.status }}
                  </span>
                </td>
              </tr>
            </ng-template>
          </app-table>
        </section>
      }
    </section>
  `,
  styles: [`
    .admin-dashboard {
      padding: 2rem;
      animation: fadeIn 0.25s ease-out;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--primary-color, #002131);
      margin-bottom: 0.5rem;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      color: var(--primary-color, #002131);
      letter-spacing: -0.04em;
    }

    .dashboard-header p,
    .approval-copy p,
    .metric-description,
    .dashboard-state p {
      color: var(--on-surface-variant, #5f6368);
    }

    .updated-card {
      min-width: 13rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 1rem;
      background: #ffffff;
      box-shadow: 0 20px 50px rgba(0, 33, 49, 0.06);
      border: 1px solid rgba(195, 198, 209, 0.35);
    }

    .updated-card span {
      color: #00658f;
    }

    .updated-card small {
      display: block;
      color: var(--on-surface-variant, #5f6368);
      margin-bottom: 0.25rem;
    }

    .updated-card strong {
      color: var(--primary-color, #002131);
      font-size: 0.9rem;
    }

    .dashboard-state {
      min-height: 16rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      text-align: center;
      padding: 2rem;
      border-radius: 1.25rem;
      background: #ffffff;
      border: 1px solid rgba(195, 198, 209, 0.35);
    }

    .dashboard-state--error > .material-symbols-outlined {
      font-size: 3rem;
      color: #dc2626;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    @media (min-width: 768px) {
      .metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .metric-card {
      position: relative;
      overflow: hidden;
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      min-height: 10rem;
      border-radius: 1.25rem;
      background: #ffffff;
      border: 1px solid rgba(195, 198, 209, 0.35);
      box-shadow: 0 20px 50px rgba(0, 33, 49, 0.05);
    }

    .metric-card::after {
      content: '';
      position: absolute;
      width: 8rem;
      height: 8rem;
      right: -3rem;
      top: -3rem;
      border-radius: 999px;
      opacity: 0.12;
      filter: blur(4px);
    }

    .metric-card--students::after { background: #00a6e4; }
    .metric-card--subjects::after { background: #00374f; }
    .metric-card--approved::after { background: #16a34a; }
    .metric-card--failed::after { background: #dc2626; }

    .metric-icon {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 1rem;
      background: rgba(198, 231, 255, 0.45);
      color: #004c6b;
    }

    .metric-icon span {
      font-size: 1.75rem;
    }

    .metric-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--on-surface-variant, #5f6368);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.65rem;
    }

    .metric-value {
      display: block;
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      line-height: 1;
      color: var(--primary-color, #002131);
      margin-bottom: 0.75rem;
    }

    .metric-description {
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .approval-panel {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 1.25rem;
      background: linear-gradient(135deg, #ffffff, #f5fbff);
      border: 1px solid rgba(195, 198, 209, 0.35);
      box-shadow: 0 20px 50px rgba(0, 33, 49, 0.04);
      margin-bottom: 1.5rem;
    }

    @media (min-width: 900px) {
      .approval-panel {
        grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
        align-items: center;
      }
    }

    .approval-copy h2 {
      font-size: 1.4rem;
      color: var(--primary-color, #002131);
      margin-bottom: 0.5rem;
    }

    .approval-bars {
      display: grid;
      gap: 1rem;
    }

    .bar-row {
      display: grid;
      gap: 0.5rem;
    }

    .bar-label {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-weight: 700;
      color: var(--primary-color, #002131);
    }

    .bar-track {
      height: 0.85rem;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(195, 198, 209, 0.35);
    }

    .bar-fill {
      height: 100%;
      border-radius: inherit;
      transition: width 0.3s ease;
    }

    .bar-fill--approved { background: #16a34a; }
    .bar-fill--failed { background: #dc2626; }

    .critical-subjects-panel {
      padding: 1.5rem;
      border-radius: 1.25rem;
      background: #ffffff;
      border: 1px solid rgba(195, 198, 209, 0.35);
      box-shadow: 0 20px 50px rgba(0, 33, 49, 0.04);
    }

    .panel-header {
      margin-bottom: 1.25rem;
    }

    .panel-header h2 {
      font-size: 1.4rem;
      color: var(--primary-color, #002131);
      margin-bottom: 0.25rem;
    }

    .table-row {
      transition: background 0.2s ease;
    }

    .table-row:hover {
      background: rgba(198, 231, 255, 0.15);
    }

    .code-cell code {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      color: #00658f;
      background: rgba(0, 101, 143, 0.06);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }

    .name-cell strong {
      color: var(--primary-color, #002131);
    }

    .rate-badge {
      display: inline-block;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      background: rgba(195, 198, 209, 0.25);
      color: var(--primary-color, #002131);
    }

    .rate-badge--high {
      background: rgba(220, 38, 38, 0.08);
      color: #dc2626;
    }

    .status-indicator {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      letter-spacing: 0.05em;
    }

    .status-indicator--activa {
      background: rgba(22, 163, 74, 0.08);
      color: #16a34a;
    }

    .status-indicator--cerrada {
      background: rgba(95, 99, 104, 0.08);
      color: #5f6368;
    }

    @media (max-width: 700px) {
      .admin-dashboard {
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
      }

      .updated-card {
        width: 100%;
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

  readonly criticalColumns = computed<TableColumn[]>(() => [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Materia' },
    { key: 'teacherName', label: 'Docente' },
    { key: 'failureRate', label: '% Reprobación' },
    { key: 'status', label: 'Estado' },
  ]);

  readonly dashboardCards = computed<DashboardCard[]>(() => {
    const summary = this.summary();

    return [
      {
        title: 'Total de estudiantes',
        value: this.formatInteger(summary?.totalStudents ?? 0),
        description: 'Estudiantes registrados en el sistema.',
        icon: 'groups',
        accent: 'students',
      },
      {
        title: 'Materias activas',
        value: this.formatInteger(summary?.activeSubjects ?? 0),
        description: 'Materias habilitadas para la gestión académica.',
        icon: 'menu_book',
        accent: 'subjects',
      },
      {
        title: 'Índice de aprobados',
        value: this.formatPercentage(summary?.approvedRate ?? 0),
        description: this.buildStudentCountDescription(summary?.approvedStudents ?? 0, 'aprobados'),
        icon: 'trending_up',
        accent: 'approved',
      },
      {
        title: 'Índice de reprobados',
        value: this.formatPercentage(summary?.failedRate ?? 0),
        description: this.buildStudentCountDescription(summary?.failedStudents ?? 0, 'reprobados'),
        icon: 'trending_down',
        accent: 'failed',
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
        next: (summary) => {
          this.summary.set(summary);
        },
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

  private buildStudentCountDescription(count: number, label: string): string {
    if (count <= 0) {
      return `Sin estudiantes ${label} registrados.`;
    }

    return `${this.formatInteger(count)} estudiantes ${label}.`;
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
