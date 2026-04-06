import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class Badge {
  text = input.required<string>();
  type = input<'info' | 'warning' | 'dark'>('info');
}
