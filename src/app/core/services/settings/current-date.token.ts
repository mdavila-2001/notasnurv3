import { InjectionToken } from '@angular/core';

export const CURRENT_DATE = new InjectionToken<() => Date>('CURRENT_DATE', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
