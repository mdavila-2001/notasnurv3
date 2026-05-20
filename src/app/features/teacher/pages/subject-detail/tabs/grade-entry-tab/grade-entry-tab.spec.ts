import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeEntryTab } from './grade-entry-tab';

import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { GradeService } from '../../../../services/grade.service';

describe('GradeEntryTab', () => {
  let component: GradeEntryTab;
  let fixture: ComponentFixture<GradeEntryTab>;
  let mockGradeService: any;

  beforeEach(async () => {
    mockGradeService = {
      components: signal([]),
      selectedComponentId: signal(null),
      studentRows: signal([]),
      gradedCount: signal(0),
      totalCount: signal(0),
      completionPercentage: signal(0),
      error: signal(null),
      isLoading: signal(false),
      selectedComponent: signal(null),
      selectComponent: vi.fn(),
      clearError: vi.fn(),
      updateGrade: vi.fn(),
      saveGrade: vi.fn(() => of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [GradeEntryTab],
      providers: [
        { provide: GradeService, useValue: mockGradeService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GradeEntryTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
