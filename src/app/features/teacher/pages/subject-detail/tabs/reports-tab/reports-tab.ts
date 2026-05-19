import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../../services/report.service';
import { ReportType } from '../../../../../../core/models/report.model';
import { Button } from '../../../../../../shared/components/button/button';
import { Loader } from '../../../../../../shared/components/loader/loader';
import { Modal } from '../../../../../../shared/components/modal/modal';

@Component({
  selector: 'app-reports-tab',
  standalone: true,
  imports: [CommonModule, Button, Loader, Modal],
  templateUrl: './reports-tab.html',
  styleUrl: './reports-tab.css',
})
export class ReportsTab {
  readonly service = inject(ReportService);

  readonly isCloseModalOpen = signal(false);
  readonly subject = this.service.subject;
  readonly isSubjectClosed = this.service.isSubjectClosed;

  readonly isAnyReportDownloading = computed(() => this.service.isDownloading() !== null);

  handleDownload(reportType: ReportType): void {
    this.service.download(reportType).subscribe();
  }

  openCloseSubjectModal(): void {
    if (this.service.isClosingSubject() || this.isSubjectClosed()) {
      return;
    }

    this.isCloseModalOpen.set(true);
  }

  closeCloseSubjectModal(): void {
    if (this.service.isClosingSubject()) {
      return;
    }

    this.isCloseModalOpen.set(false);
  }

  confirmCloseSubject(): void {
    this.service.closeSubject().subscribe((success) => {
      if (success) {
        this.isCloseModalOpen.set(false);
      }
    });
  }
}
