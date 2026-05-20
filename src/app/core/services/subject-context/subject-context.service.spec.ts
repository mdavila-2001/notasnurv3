import { TestBed } from '@angular/core/testing';

import { SubjectContextService } from './subject-context.service';

describe('SubjectContextService', () => {
  let service: SubjectContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubjectContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
