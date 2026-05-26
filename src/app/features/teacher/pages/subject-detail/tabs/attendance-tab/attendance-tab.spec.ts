import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceTab } from './attendance-tab';

import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AttendanceService } from '../../../../services/attendance.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

import { provideRouter } from '@angular/router';

describe('AttendanceTab', () => {
  let component: AttendanceTab;
  let fixture: ComponentFixture<AttendanceTab>;
  let mockAttendanceService: any;
  let mockOperationalService: any;

  beforeEach(async () => {
    mockOperationalService = {
      isLoading: signal(false),
      students: signal([]),
      evaluationPlan: signal({ components: [] }),
      subject: signal(null),
      clearStore: vi.fn(),
      loadSubjectContext: vi.fn(),
    };

    mockAttendanceService = {
      attendanceDraft: signal([]),
      isReadyToSubmit: signal(false),
      date: signal('2026-05-20'),
      isSaving: signal(false),
      isDraftHydrating: signal(false),
      recordCounts: signal({ present: 0, late: 0, absent: 0, total: 0 }),
      error: signal(null),
      successMessage: signal(null),
      initializeDraft: vi.fn(),
      setDate: vi.fn(),
      updateStudentStatus: vi.fn(),
      markAllAs: vi.fn(),
      submit: vi.fn(() => of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [AttendanceTab],
      providers: [
        { provide: SubjectOperationalService, useValue: mockOperationalService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
