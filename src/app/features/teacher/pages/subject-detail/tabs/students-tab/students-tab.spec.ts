import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsTab } from './students-tab';

describe('StudentsTab', () => {
  let component: StudentsTab;
  let fixture: ComponentFixture<StudentsTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsTab],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
