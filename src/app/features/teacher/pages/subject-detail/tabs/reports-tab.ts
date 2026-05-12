import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../services/report.service';

@Component({
  selector: 'app-reports-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-tab">
      <div class="tab-header">
        <h2>Reportes</h2>
      </div>

      @if (service.lastSuccess(); as msg) {
        <div class="success-banner">{{ msg }}</div>
      }

      @if (service.error(); as errorMessage) {
        <div class="error-banner">{{ errorMessage }}</div>
      }

      <div class="reports-grid">
        @for (option of service.reportOptions; track option.type) {
          <div class="report-card">
            <div class="report-icon">
              <span class="material-symbols-outlined">{{ option.icon }}</span>
            </div>
            <div class="report-info">
              <h3>{{ option.label }}</h3>
              <p>{{ option.description }}</p>
            </div>
            <button
              class="btn-download"
              [disabled]="service.isDownloading() !== null"
              (click)="handleDownload(option.type)"
            >
              @if (service.isDownloading() === option.type) {
                <span class="downloading">
                  <span class="material-symbols-outlined spinning">progress_activity</span>
                  Descargando...
                </span>
              } @else {
                <span class="download-content">
                  <span class="material-symbols-outlined">download</span>
                  Descargar
                </span>
              }
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .reports-tab { padding: 1rem 0; }
    .tab-header { margin-bottom: 1.5rem; }
    .tab-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--primary-color, #002131); }
    .success-banner {
      padding: 0.75rem 1rem; border-radius: 0.5rem; background: #dcfce7;
      color: #166534; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .error-banner {
      padding: 0.75rem 1rem; border-radius: 0.5rem; background: #fef2f2;
      color: #991b1b; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .reports-grid { display: flex; flex-direction: column; gap: 1rem; max-width: 32rem; }
    .report-card {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem; border-radius: 0.75rem;
      border: 1px solid #e5e7eb; background: white;
      transition: all 0.2s;
    }
    .report-card:hover { border-color: #d1d5db; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .report-icon {
      width: 3rem; height: 3rem; border-radius: 0.75rem;
      background: #f0f9ff; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .report-icon .material-symbols-outlined { color: var(--primary-color, #002131); font-size: 1.5rem; }
    .report-info { flex: 1; min-width: 0; }
    .report-info h3 { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.25rem 0; color: #111827; }
    .report-info p { font-size: 0.8125rem; margin: 0; color: #6b7280; line-height: 1.4; }
    .btn-download {
      padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem;
      font-weight: 600; cursor: pointer; white-space: nowrap;
      border: 1px solid #d1d5db; background: white; color: #374151;
      transition: all 0.2s; flex-shrink: 0;
    }
    .btn-download:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .btn-download:disabled { opacity: 0.5; cursor: not-allowed; }
    .download-content, .downloading {
      display: flex; align-items: center; gap: 0.375rem;
    }
    .downloading { color: var(--primary-color, #002131); }
    .spinning { animation: spin 1s linear infinite; font-size: 1rem !important; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class ReportsTabComponent {
  readonly subjectId = input.required<string>();
  readonly service = inject(ReportService);

  handleDownload(reportType: 'acta-pdf' | 'asistencia-excel') {
    this.service.clearFeedback();
    this.service.download(this.subjectId(), reportType).subscribe();
  }
}
