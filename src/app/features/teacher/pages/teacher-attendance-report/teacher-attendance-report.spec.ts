import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherAttendanceReport } from './teacher-attendance-report';

describe('TeacherAttendanceReport', () => {
  let component: TeacherAttendanceReport;
  let fixture: ComponentFixture<TeacherAttendanceReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherAttendanceReport],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherAttendanceReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
