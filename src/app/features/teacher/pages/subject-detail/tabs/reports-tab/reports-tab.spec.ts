import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { ReportsTab } from './reports-tab';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ReportService } from '../../../../services/report.service';

describe('ReportsTab', () => {
  let component: ReportsTab;
  let fixture: ComponentFixture<ReportsTab>;
  let mockReportService: any;

  beforeEach(async () => {
    mockReportService = {
      subject: signal({ id: 'subj-1', name: 'Subject 1', recordStatus: 'ACTIVE' }),
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
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should download a report when handleDownload is called', () => {
    component.handleDownload('grades-pdf');
    expect(mockReportService.download).toHaveBeenCalledWith('grades-pdf');
  });

  it('should open close modal if subject is active and not closing', () => {
    expect(component.isCloseModalOpen()).toBe(false);

    component.openCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(true);
  });

  it('should not open close modal if subject is already closed', () => {
    mockReportService.isSubjectClosed.set(true);
    fixture.detectChanges();

    component.openCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(false);
  });

  it('should not open close modal if subject is currently closing', () => {
    mockReportService.isClosingSubject.set(true);
    fixture.detectChanges();

    component.openCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(false);
  });

  it('should close close modal if not closing', () => {
    component.openCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(true);

    component.closeCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(false);
  });

  it('should not close close modal if subject is currently closing', () => {
    component.openCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(true);

    mockReportService.isClosingSubject.set(true);
    fixture.detectChanges();

    component.closeCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(true);
  });

  it('should confirm close subject and close modal on success', () => {
    component.openCloseSubjectModal();
    expect(component.isCloseModalOpen()).toBe(true);

    component.confirmCloseSubject();

    expect(mockReportService.closeSubject).toHaveBeenCalled();
    expect(component.isCloseModalOpen()).toBe(false);
  });

  it('should verify isAnyReportDownloading status', () => {
    expect(component.isAnyReportDownloading()).toBe(false);

    mockReportService.isDownloading.set('grades-pdf');
    fixture.detectChanges();

    expect(component.isAnyReportDownloading()).toBe(true);
  });
});
