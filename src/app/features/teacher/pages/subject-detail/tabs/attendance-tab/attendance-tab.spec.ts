import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceTab } from './attendance-tab';

describe('AttendanceTab', () => {
  let component: AttendanceTab;
  let fixture: ComponentFixture<AttendanceTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceTab],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
