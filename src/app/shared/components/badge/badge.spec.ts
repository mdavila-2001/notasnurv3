import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  let component: Badge;
  let fixture: ComponentFixture<Badge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Badge],
    }).compileComponents();

    fixture = TestBed.createComponent(Badge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve variant and label for APROBADO', () => {
    fixture.componentRef.setInput('status', 'APROBADO');
    fixture.detectChanges();

    expect(component.resolvedVariant()).toBe('success');
    expect(component.badgeLabel()).toBe('Aprobado');
  });

  it('should resolve variant and label for REPROBADO', () => {
    fixture.componentRef.setInput('status', 'REPROBADO');
    fixture.detectChanges();

    expect(component.resolvedVariant()).toBe('danger');
    expect(component.badgeLabel()).toBe('Reprobado');
  });

  it('should resolve variant and label for REPROBADO_POR_FALTAS', () => {
    fixture.componentRef.setInput('status', 'REPROBADO_POR_FALTAS');
    fixture.detectChanges();

    expect(component.resolvedVariant()).toBe('danger');
    expect(component.badgeLabel()).toBe('Reprobado por Faltas');
  });

  it('should resolve variant and label for PENDIENTE', () => {
    fixture.componentRef.setInput('status', 'PENDIENTE');
    fixture.detectChanges();

    expect(component.resolvedVariant()).toBe('warning');
    expect(component.badgeLabel()).toBe('Pendiente');
  });

  it('should override variant when color input is explicitly provided', () => {
    fixture.componentRef.setInput('status', 'APROBADO');
    fixture.componentRef.setInput('color', 'neutral');
    fixture.detectChanges();

    expect(component.resolvedVariant()).toBe('neutral');
  });
});
