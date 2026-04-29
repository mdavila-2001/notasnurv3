import { Component, input, output, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnInit, OnDestroy {
  type = input<'success' | 'info' | 'warning' | 'error'>('info');
  title = input<string>('');
  message = input.required<string>();
  duration = input<number>(5000);

  closed = output<void>();

  private timeoutId: any;

  ngOnInit() {
    if (this.duration() > 0) {
      this.timeoutId = setTimeout(() => this.onClose(), this.duration());
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  onClose() {
    this.closed.emit();
  }
}
