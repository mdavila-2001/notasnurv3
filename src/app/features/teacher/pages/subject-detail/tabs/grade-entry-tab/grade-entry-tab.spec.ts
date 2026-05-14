import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeEntryTab } from './grade-entry-tab';

describe('GradeEntryTab', () => {
  let component: GradeEntryTab;
  let fixture: ComponentFixture<GradeEntryTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeEntryTab],
    }).compileComponents();

    fixture = TestBed.createComponent(GradeEntryTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
