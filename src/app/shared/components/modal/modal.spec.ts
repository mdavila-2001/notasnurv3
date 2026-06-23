import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Modal } from './modal';

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed when onClose is called', () => {
    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    component.onClose();
    expect(emitted).toBe(true);
  });

  it('should emit closed on Escape keydown if open', () => {
    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.onEscapeKey();
    expect(emitted).toBe(true);
  });

  it('should not emit closed on Escape keydown if closed', () => {
    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    component.onEscapeKey();
    expect(emitted).toBe(false);
  });

  it('should emit closed on backdrop overlay click if disableBackdropClick is false', () => {
    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('disableBackdropClick', false);
    fixture.detectChanges();

    const mockEvent = {
      target: {
        classList: {
          contains: (cls: string) => cls === 'modal-overlay',
        },
      },
    } as any;

    component.closeOnBackdrop(mockEvent);
    expect(emitted).toBe(true);
  });

  it('should not emit closed on backdrop overlay click if disableBackdropClick is true', () => {
    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('disableBackdropClick', true);
    fixture.detectChanges();

    const mockEvent = {
      target: {
        classList: {
          contains: (cls: string) => cls === 'modal-overlay',
        },
      },
    } as any;

    component.closeOnBackdrop(mockEvent);
    expect(emitted).toBe(false);
  });

  it('should not emit closed if click target is not the modal overlay', () => {
    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('disableBackdropClick', false);
    fixture.detectChanges();

    const mockEvent = {
      target: {
        classList: {
          contains: (cls: string) => cls === 'modal-content', // different class name
        },
      },
    } as any;

    component.closeOnBackdrop(mockEvent);
    expect(emitted).toBe(false);
  });
});
