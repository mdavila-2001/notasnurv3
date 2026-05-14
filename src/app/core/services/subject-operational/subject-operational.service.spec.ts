import { TestBed } from '@angular/core/testing';

import { SubjectOperationalService } from './subject-operational.service';

describe('SubjectOperationalService', () => {
  let service: SubjectOperationalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubjectOperationalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
