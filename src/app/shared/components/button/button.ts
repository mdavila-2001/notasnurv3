import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  variant = input<'primary' | 'secondary' | 'tertiary'>('primary');
  disabled = input<boolean>(false);
  clicked = output<MouseEvent>();
}
