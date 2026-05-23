import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Table } from './table';

describe('Table', () => {
  let component: Table<any>;
  let fixture: ComponentFixture<Table<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Table],
    }).compileComponents();

    fixture = TestBed.createComponent<Table<any>>(Table);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', []);
    fixture.componentRef.setInput('data', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
