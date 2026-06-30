import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked event and stop propagation when handleClick is called and not disabled', () => {
    let emitted = false;
    let eventPassed: any = null;
    component.clicked.subscribe((e) => {
      emitted = true;
      eventPassed = e;
    });

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as any;

    component.handleClick(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(emitted).toBe(true);
    expect(eventPassed).toBe(mockEvent);
  });

  it('should not emit clicked event and not stop propagation when handleClick is called and disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    let emitted = false;
    component.clicked.subscribe(() => {
      emitted = true;
    });

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as any;

    component.handleClick(mockEvent);

    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    expect(emitted).toBe(false);
  });
});
