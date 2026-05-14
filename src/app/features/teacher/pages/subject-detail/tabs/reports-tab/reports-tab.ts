import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../../services/report.service';
import { Button } from '../../../../../../shared/components/button/button';

@Component({
  selector: 'app-reports-tab',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './reports-tab.html',
  styleUrl: './reports-tab.css',
})
export class ReportsTabComponent {
  readonly subjectId = input.required<string>();
  readonly service = inject(ReportService);

  handleDownload(reportType: 'acta-pdf' | 'asistencia-excel') {
    this.service.clearFeedback();
    this.service.download(this.subjectId(), reportType).subscribe();
  }
}