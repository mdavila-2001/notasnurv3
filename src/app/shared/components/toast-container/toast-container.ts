import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { Toast } from '../toast/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [Toast],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast
          [type]="toast.type"
          [title]="toast.title"
          [message]="toast.message"
          [duration]="0"
          (closed)="toastService.dismiss(toast.id)"
        />
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
  `]
})
export class ToastContainer {
  readonly toastService = inject(ToastService);
}
