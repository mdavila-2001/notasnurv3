import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectDetailComponent } from './subject-detail';

describe('SubjectDetailComponent', () => {
  let component: SubjectDetailComponent;
  let fixture: ComponentFixture<SubjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
