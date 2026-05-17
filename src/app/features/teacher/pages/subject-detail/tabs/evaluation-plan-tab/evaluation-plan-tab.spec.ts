import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationPlanTab } from './evaluation-plan-tab';

describe('EvaluationPlanTab', () => {
  let component: EvaluationPlanTab;
  let fixture: ComponentFixture<EvaluationPlanTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationPlanTab],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationPlanTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
