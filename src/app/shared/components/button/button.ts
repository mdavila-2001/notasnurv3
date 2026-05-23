import { Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  variant = input<'primary' | 'secondary' | 'tertiary' | 'present' | 'absent' | 'justified'>('primary');
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  @Output() readonly clicked = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }

    event.stopPropagation();
    this.clicked.emit(event);
  }
}
