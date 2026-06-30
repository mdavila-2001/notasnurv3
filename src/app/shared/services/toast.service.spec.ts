import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a toast with default values and increment IDs', () => {
    expect(service.toasts().length).toBe(0);

    service.show('Test Message');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]).toEqual({
      id: 0,
      type: 'info',
      title: '',
      message: 'Test Message',
      duration: 5000,
    });

    service.show('Another Message');
    expect(service.toasts().length).toBe(2);
    expect(service.toasts()[1].id).toBe(1);
  });

  it('should create success, error, warning, and info toasts', () => {
    service.success('Success message', 'Success Title');
    service.error('Error message', 'Error Title');
    service.warning('Warning message', 'Warning Title');
    service.info('Info message', 'Info Title');

    const list = service.toasts();
    expect(list.length).toBe(4);

    expect(list[0].type).toBe('success');
    expect(list[0].title).toBe('Success Title');

    expect(list[1].type).toBe('error');
    expect(list[1].title).toBe('Error Title');

    expect(list[2].type).toBe('warning');
    expect(list[2].title).toBe('Warning Title');

    expect(list[3].type).toBe('info');
    expect(list[3].title).toBe('Info Title');
  });

  it('should dismiss a toast by ID', () => {
    service.show('Msg 1');
    service.show('Msg 2');
    expect(service.toasts().length).toBe(2);

    service.dismiss(0);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Msg 2');
  });

  it('should clear all toasts', () => {
    service.show('Msg 1');
    service.show('Msg 2');
    expect(service.toasts().length).toBe(2);

    service.clearAll();
    expect(service.toasts().length).toBe(0);
  });

  it('should automatically dismiss toast after duration using fake timers', () => {
    vi.useFakeTimers();

    service.show('Timed message', 'info', '', 3000);
    expect(service.toasts().length).toBe(1);

    // Advance time by 2999ms
    vi.advanceTimersByTime(2999);
    expect(service.toasts().length).toBe(1);

    // Advance to 3000ms
    vi.advanceTimersByTime(1);
    expect(service.toasts().length).toBe(0);

    vi.useRealTimers();
  });

  it('should not setup automatic dismissal if duration is 0', () => {
    vi.useFakeTimers();

    service.show('Infinite message', 'info', '', 0);
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(100000);
    expect(service.toasts().length).toBe(1);

    vi.useRealTimers();
  });
});
