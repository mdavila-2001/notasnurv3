import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  isOpen = input<boolean>(false);
  title = input<string>('Confirmación');

  disableBackdropClick = input<boolean>(false);

  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen()) {
      this.onClose();
    }
  }

  onClose() {
    this.closed.emit();
  }

  closeOnBackdrop(event: MouseEvent) {
    if (this.disableBackdropClick()) return;
    
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}
