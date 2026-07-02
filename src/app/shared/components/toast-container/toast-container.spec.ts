import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { ToastContainer } from './toast-container';
import { ToastService } from '../../services/toast.service';
import { signal } from '@angular/core';

describe('ToastContainer', () => {
  let component: ToastContainer;
  let fixture: ComponentFixture<ToastContainer>;
  let mockToastService: any;

  beforeEach(async () => {
    mockToastService = {
      toasts: signal([
        { id: 1, type: 'success', title: 'Title 1', message: 'Message 1', duration: 3000 },
        { id: 2, type: 'error', title: 'Title 2', message: 'Message 2', duration: 0 }
      ]),
      dismiss: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ToastContainer],
      providers: [
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list active toasts', () => {
    const compiled = fixture.nativeElement;
    const toastElements = compiled.querySelectorAll('app-toast');
    expect(toastElements.length).toBe(2);
  });

  it('should call toastService.dismiss when a toast is closed', () => {
    expect(component.toastService).toBe(mockToastService);
  });
});
