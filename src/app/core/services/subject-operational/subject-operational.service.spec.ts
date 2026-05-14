import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SubjectOperationalService } from './subject-operational.service';

describe('SubjectOperationalService', () => {
  let service: SubjectOperationalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SubjectOperationalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
