import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader {
  variant = input<'spinner' | 'dots'>('spinner');
  size = input<'sm' | 'md' | 'lg'>('md');
  label = input<string>('Cargando...');
  showLabel = input<boolean>(true);
  centered = input<boolean>(false);
}
