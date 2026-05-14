import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

export type ReportType = 'acta-pdf' | 'asistencia-excel';

export interface ReportOption {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  filename: (subjectId: string) => string;
  endpoint: (subjectId: string) => string;
  mimeType: string;
}

import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';

@Injectable()
export class ReportService {
  private readonly api = inject(ApiService);
  private readonly operationalService = inject(SubjectOperationalService);

  private readonly _isDownloading = signal<ReportType | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _lastSuccess = signal<string | null>(null);

  readonly isDownloading = computed(() => this._isDownloading());
  readonly error = computed(() => this._error());
  readonly lastSuccess = computed(() => this._lastSuccess());

  readonly reportOptions: ReportOption[] = [
    {
      type: 'acta-pdf',
      label: 'Acta de Notas (PDF)',
      description: 'Descargar el acta oficial de calificaciones en formato PDF',
      icon: 'description',
      filename: id => `Acta_Notas_${id}.pdf`,
      endpoint: id => `/reports/subjects/${id}/acta-notas/pdf`,
      mimeType: 'application/pdf',
    },
    {
      type: 'asistencia-excel',
      label: 'Reporte de Asistencia (Excel)',
      description: 'Descargar el reporte detallado de asistencias en Excel',
      icon: 'table_chart',
      filename: id => `Asistencias_${id}.xlsx`,
      endpoint: id => `/reports/subjects/${id}/asistencia/excel`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  ];

  download(reportType: ReportType): Observable<boolean> {
    const subjectId = this.operationalService.subject()?.id?.toString();
    const option = this.reportOptions.find(r => r.type === reportType);
    if (!option || !subjectId) return of(false);

    this._isDownloading.set(reportType);
    this._error.set(null);
    this._lastSuccess.set(null);

    return this.api.downloadBlob(option.endpoint(subjectId)).pipe(
      tap(blob => {
        this.triggerDownload(blob, option.filename(subjectId));
        this._isDownloading.set(null);
        this._lastSuccess.set(`${option.label} descargado correctamente`);
      }),
      map(() => true),
      catchError(() => {
        this._isDownloading.set(null);
        this._error.set('Error al descargar el reporte. Verifique que existan datos.');
        return of(false);
      }),
    );
  }

  clearFeedback(): void {
    this._error.set(null);
    this._lastSuccess.set(null);
  }

  reset(): void {
    this._isDownloading.set(null);
    this._error.set(null);
    this._lastSuccess.set(null);
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
