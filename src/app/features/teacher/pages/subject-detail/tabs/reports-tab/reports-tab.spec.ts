import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsTab } from './reports-tab';

import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReportService } from '../../../../services/report.service';

describe('ReportsTab', () => {
  let component: ReportsTab;
  let fixture: ComponentFixture<ReportsTab>;
  let mockReportService: any;

  beforeEach(async () => {
    mockReportService = {
      subject: signal(null),
      isSubjectClosed: signal(false),
      isDownloading: signal(null),
      isClosingSubject: signal(false),
      download: vi.fn(() => of(true)),
      closeSubject: vi.fn(() => of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [ReportsTab],
      providers: [
        { provide: ReportService, useValue: mockReportService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
