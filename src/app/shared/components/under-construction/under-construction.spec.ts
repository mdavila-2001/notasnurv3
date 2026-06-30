import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UnderConstruction } from './under-construction';
import { vi } from 'vitest';

describe('UnderConstruction', () => {
  let component: UnderConstruction;
  let fixture: ComponentFixture<UnderConstruction>;
  let mockRouter: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockRouter = {
      url: '/teacher/attendance',
      navigate: vi.fn(),
    };

    mockAuthService = {
      getUserRole: vi.fn().mockReturnValue('TEACHER'),
    };

    await TestBed.configureTestingModule({
      imports: [UnderConstruction],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnderConstruction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set dynamic feature name based on router url', () => {
    expect(component.featureName()).toBe('Control y Reporte de Asistencia');
  });

  it('should navigate back based on user role', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/teacher/dashboard']);
  });
});
