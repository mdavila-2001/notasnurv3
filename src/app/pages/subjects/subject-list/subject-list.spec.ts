import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectListComponent } from './subject-list';

describe('SubjectListComponent', () => {
  let component: SubjectListComponent;
  let fixture: ComponentFixture<SubjectListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
