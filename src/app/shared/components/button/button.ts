import { Component, input, output } from '@angular/core';

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
  clicked = output<MouseEvent>();

  handleClick(event: MouseEvent) {
    if (this.disabled()) {
      return;
    }

    this.clicked.emit(event);
  }
}
