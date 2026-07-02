import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboard } from './admin-dashboard';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AdminDashboardSummary } from '../../../../core/models/admin-dashboard.model';

describe('AdminDashboard', () => {
  let component: AdminDashboard;
  let fixture: ComponentFixture<AdminDashboard>;
  let mockDashboardService: any;
  let mockToastService: any;

  const mockSummary: AdminDashboardSummary = {
    totalStudents: 1500,
    activeSubjects: 45,
    approvedRate: 88.5,
    failedRate: 11.5,
    approvedStudents: 1327,
    failedStudents: 173,
    totalEvaluated: 1500,
    criticalSubjects: [
      {
        id: '1',
        code: 'MAT-101',
        name: 'Álgebra Lineal',
        teacherName: 'Carlos Mendoza',
        failureRate: 45.5,
        status: 'CERRADA',
      },
      {
        id: '2',
        code: 'INF-220',
        name: 'Estructuras de Datos I',
        teacherName: 'Martha Quiroga',
        failureRate: 42.0,
        status: 'ACTIVA',
      }
    ],
    generatedAt: '2026-05-22T18:00:00'
  };

  beforeEach(async () => {
    mockDashboardService = {
      getSummary: vi.fn().mockReturnValue(of(mockSummary))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [
        { provide: AdminDashboardService, useValue: mockDashboardService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load dashboard summary on init', () => {
    fixture.detectChanges();
    expect(mockDashboardService.getSummary).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockSummary);
    expect(component.isLoading()).toBe(false);
  });

  it('should compute dashboard cards correctly based on summary', () => {
    fixture.detectChanges();
    const cards = component.dashboardCards();
    expect(cards.length).toBe(4);
    
    expect(cards[0].title).toBe('Total de estudiantes');
    expect(cards[0].value).toBe('1.500');
    expect(cards[0].accent).toBe('students');

    expect(cards[1].title).toBe('Materias activas');
    expect(cards[1].value).toBe('45');
    
    expect(cards[2].title).toBe('Índice de aprobados');
    expect(cards[2].value).toBe('88,5%');

    expect(cards[3].title).toBe('Índice de reprobados');
    expect(cards[3].value).toBe('11,5%');
  });

  it('should display error state when loading dashboard fails', () => {
    mockDashboardService.getSummary.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('API Error');
    expect(component.summary()).toBeNull();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dashboard-state--error')).toBeTruthy();
    expect(compiled.querySelector('h2')?.textContent).toContain('No se pudo cargar el dashboard');
  });

  it('should call loadDashboard again on retry click', () => {
    mockDashboardService.getSummary.mockReturnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    mockDashboardService.getSummary.mockClear();
    
    mockDashboardService.getSummary.mockReturnValue(of(mockSummary));
    
    component.loadDashboard();
    fixture.detectChanges();

    expect(mockDashboardService.getSummary).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockSummary);
    expect(component.errorMessage()).toBeNull();
  });
});
