import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<ToastMessage[]>([]);

  readonly toasts = computed(() => this._toasts());

  show(message: string, type: ToastType = 'info', title = '', duration = 5000): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      type,
      title,
      message,
      duration,
    };

    this._toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  success(message: string, title = ''): void {
    this.show(message, 'success', title);
  }

  error(message: string, title = ''): void {
    this.show(message, 'error', title);
  }

  warning(message: string, title = ''): void {
    this.show(message, 'warning', title);
  }

  info(message: string, title = ''): void {
    this.show(message, 'info', title);
  }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  clearAll(): void {
    this._toasts.set([]);
  }
}
