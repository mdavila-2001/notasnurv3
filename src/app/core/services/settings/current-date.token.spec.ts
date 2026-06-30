import { TestBed } from '@angular/core/testing';
import { CURRENT_DATE } from './current-date.token';
import { describe, it, expect } from 'vitest';

describe('CURRENT_DATE token', () => {
  it('should provide a function that returns a Date', () => {
    const getCurrentDate = TestBed.inject(CURRENT_DATE);
    expect(getCurrentDate).toBeTypeOf('function');
    
    const date = getCurrentDate();
    expect(date).toBeInstanceOf(Date);
    
    // The returned date should be very close to the current time
    const diff = Math.abs(date.getTime() - Date.now());
    expect(diff).toBeLessThan(1000); // within 1 second
  });
});
