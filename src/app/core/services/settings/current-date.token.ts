import { InjectionToken } from '@angular/core';

/**
 * Injection token that provides a function returning the current Date.
 * By default, it returns a function that creates a new Date instance.
 * In unit tests, this function can be mocked to return a fixed date.
 */
export const CURRENT_DATE = new InjectionToken<() => Date>('CURRENT_DATE', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
