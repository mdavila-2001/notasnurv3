import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Toast } from './toast';

describe('Toast', () => {
  let component: Toast;
  let fixture: ComponentFixture<Toast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toast],
    }).compileComponents();

    fixture = TestBed.createComponent(Toast);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('message', 'Mensaje de prueba');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
