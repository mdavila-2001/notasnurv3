import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { SubjectOperationalService } from '../../../core/services/subject-operational/subject-operational.service';
import { ApiService } from '../../../core/services/api.service';
import { AdminSubjectService } from '../../admin/services/admin-subject.service';
import { ReportOption, ReportType } from '../../../core/models/report.model';
import { SubjectResponse } from '../../../core/models/subject.model';
import { ToastService } from '../../../shared/services/toast.service';

@Injectable()
export class ReportService {
  private readonly api = inject(ApiService);
  private readonly subjectService = inject(AdminSubjectService);
  private readonly operationalService = inject(SubjectOperationalService);
  private readonly toast = inject(ToastService);

  private readonly _isDownloading = signal<ReportType | null>(null);
  private readonly _isClosingSubject = signal(false);

  readonly isDownloading = computed(() => this._isDownloading());
  readonly isClosingSubject = computed(() => this._isClosingSubject());
  readonly subject = this.operationalService.subject;
  readonly isSubjectClosed = computed(() => this.subject()?.recordStatus === 'CLOSED');

  readonly reportOptions: ReportOption[] = [
    {
      type: 'grades-pdf',
      label: 'Descargar Acta (PDF)',
      description: 'Genera y descarga el acta oficial de calificaciones en PDF.',
      icon: 'picture_as_pdf',
      filename: (subjectId) => `acta-materia-${subjectId}.pdf`,
      endpoint: (subjectId) => `/reports/grades-pdf/${subjectId}`,
      mimeType: 'application/pdf',
      successMessage: 'Acta PDF descargada correctamente.',
      errorMessage: 'No se pudo descargar el acta PDF.',
    },
    {
      type: 'grades-excel',
      label: 'Descargar Excel',
      description: 'Genera y descarga el reporte oficial de notas en Excel.',
      icon: 'table_chart',
      filename: (subjectId) => `reporte-notas-materia-${subjectId}.xls`,
      endpoint: (subjectId) => `/reports/grades-excel/${subjectId}`,
      mimeType: 'application/vnd.ms-excel',
      successMessage: 'Reporte Excel descargado correctamente.',
      errorMessage: 'No se pudo descargar el reporte Excel.',
    },
  ];

  download(reportType: ReportType): Observable<boolean> {
    const subjectId = this.subject()?.id;
    const option = this.reportOptions.find((reportOption) => reportOption.type === reportType);

    if (!subjectId || !option || this._isDownloading()) {
      return of(false);
    }

    this._isDownloading.set(reportType);

    return this.api.downloadBlob(option.endpoint(subjectId), option.mimeType).pipe(
      tap((blob) => {
        this.triggerDownload(blob, option.filename(subjectId), option.mimeType);
        this.toast.success(option.successMessage, 'Reporte generado');
      }),
      map(() => true),
      catchError(() => {
        this.toast.error(option.errorMessage, 'Error de descarga');
        return of(false);
      }),
      finalize(() => this._isDownloading.set(null)),
    );
  }

  closeSubject(): Observable<boolean> {
    const currentSubject = this.subject();

    if (!currentSubject || this._isClosingSubject() || this.isSubjectClosed()) {
      return of(false);
    }

    this._isClosingSubject.set(true);

    return this.subjectService.close(currentSubject.id).pipe(
      map((response) => response.data ?? this.createClosedFallbackSubject(currentSubject)),
      tap((closedSubject) => {
        this.operationalService.setSubjectDirectly(closedSubject);
        this.toast.success(
          'La materia fue cerrada correctamente. Esta acción ya no se puede revertir.',
          'Materia cerrada',
        );
      }),
      map(() => true),
      catchError(() => {
        this.toast.error('No se pudo cerrar la materia.', 'Error al cerrar');
        return of(false);
      }),
      finalize(() => this._isClosingSubject.set(false)),
    );
  }

  private triggerDownload(blob: Blob, filename: string, mimeType: string): void {
    const file = blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
    const url = window.URL.createObjectURL(file);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  private createClosedFallbackSubject(subject: SubjectResponse): SubjectResponse {
    return {
      ...subject,
      recordStatus: 'CLOSED',
    };
  }
}
