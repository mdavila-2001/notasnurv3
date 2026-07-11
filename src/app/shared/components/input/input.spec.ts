import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  let component: Input;
  let fixture: ComponentFixture<Input>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Input, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Input);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set initial input properties correctly', () => {
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('placeholder', 'Test Placeholder');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test Label');
    const inputEl = compiled.querySelector('input');
    expect(inputEl.placeholder).toBe('Test Placeholder');
    expect(inputEl.disabled).toBe(true);
  });

  it('should emit value on input change', () => {
    let emittedValue: any = null;
    component.valueChange.subscribe(val => emittedValue = val);

    fixture.detectChanges();
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.value = 'New Value';
    inputEl.dispatchEvent(new Event('input'));

    expect(emittedValue).toBe('New Value');
  });

  it('should toggle password visibility when type is password', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    expect(component.effectiveType()).toBe('password');
    component.togglePassword();
    expect(component.effectiveType()).toBe('text');

    component.togglePassword();
    expect(component.effectiveType()).toBe('password');
  });

  it('should set touched signal on blur', () => {
    fixture.detectChanges();
    expect(component.touched()).toBe(false);

    component.onBlur();
    expect(component.touched()).toBe(true);
  });

  it('should show required error if field is empty and touched or showErrors is true', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();

    expect(component.displayErrorMessage()).toBe('');

    component.onBlur();
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('Este campo es obligatorio.');

    component.touched.set(false);
    fixture.componentRef.setInput('showErrors', true);
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('Este campo es obligatorio.');
  });

  it('should return external error message if provided', () => {
    fixture.componentRef.setInput('errorMessage', 'External validation error');
    fixture.componentRef.setInput('showErrors', true);
    fixture.detectChanges();

    expect(component.displayErrorMessage()).toBe('External validation error');
  });

  it('should validate numeric value min and max limits', () => {
    fixture.componentRef.setInput('type', 'number');
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('showErrors', true);

    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('');

    fixture.componentRef.setInput('value', 5);
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('El valor mínimo es 10.');

    fixture.componentRef.setInput('value', 150);
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('El valor máximo es 100.');

    fixture.componentRef.setInput('value', 'invalid-number');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('Ingresa un número válido.');
  });

  it('should validate text length limits', () => {
    fixture.componentRef.setInput('type', 'text');
    fixture.componentRef.setInput('minLength', 3);
    fixture.componentRef.setInput('maxLength', 8);
    fixture.componentRef.setInput('showErrors', true);

    fixture.componentRef.setInput('value', 'hello');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('');

    fixture.componentRef.setInput('value', 'hi');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('Debe tener al menos 3 caracteres.');

    fixture.componentRef.setInput('value', 'hello world');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('Debe tener máximo 8 caracteres.');
  });

  it('should validate regular expression patterns', () => {
    fixture.componentRef.setInput('type', 'text');
    fixture.componentRef.setInput('pattern', '^[0-9]+$');
    fixture.componentRef.setInput('showErrors', true);

    fixture.componentRef.setInput('value', '12345');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('');

    fixture.componentRef.setInput('value', 'abc');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('El formato ingresado no es válido.');

    fixture.componentRef.setInput('pattern', '[');
    fixture.componentRef.setInput('value', 'abc');
    fixture.detectChanges();
    expect(component.displayErrorMessage()).toBe('Patrón de validación inválido.');
  });

  it('should correctly normalize outputs of select and number types', () => {
    fixture.componentRef.setInput('type', 'number');
    fixture.detectChanges();

    const changeEvent = { target: { value: '123' } } as any;
    component.onChange(changeEvent);
    expect((component as any).normalizeOutputValue('123')).toBe(123);
    expect((component as any).normalizeOutputValue(' ')).toBe('');

    fixture.componentRef.setInput('type', 'text');
    fixture.detectChanges();
    expect((component as any).normalizeOutputValue('abc')).toBe('abc');
  });

  it('should render select options in the dropdown template', () => {
    fixture.componentRef.setInput('type', 'select');
    fixture.componentRef.setInput('options', [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' }
    ]);
    fixture.detectChanges();

    const selectEl = fixture.nativeElement.querySelector('select');
    expect(selectEl).toBeTruthy();
    const options = selectEl.querySelectorAll('option');
    expect(options.length).toBe(3);
    expect(options[1].text).toBe('Option A');
    expect(options[2].value).toBe('b');
  });
});
