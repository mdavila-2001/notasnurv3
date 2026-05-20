import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectDetail } from './subject-detail';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

describe('SubjectDetail', () => {
  let component: SubjectDetail;
  let fixture: ComponentFixture<SubjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
