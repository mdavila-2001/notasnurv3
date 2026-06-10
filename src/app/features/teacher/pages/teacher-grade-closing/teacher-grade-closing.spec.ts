import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherGradeClosing } from './teacher-grade-closing';

describe('TeacherGradeClosing', () => {
  let component: TeacherGradeClosing;
  let fixture: ComponentFixture<TeacherGradeClosing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherGradeClosing],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherGradeClosing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
