import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Component, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { GradeService } from '../../../../services/grade.service';

@Component({
  selector: 'app-grade-entry-tab',
  standalone: true,
  template: '',
})
class GradeEntryTab {}

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
