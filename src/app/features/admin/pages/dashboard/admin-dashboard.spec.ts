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
    totalSubjectsWithoutTeacher: 5,
    totalOpenActas: 10,
    globalPassRate: 88.5,
    globalFailRate: 11.5,
    studentsAtRiskCount: 173,
    managements: [
      {
        id: 1,
        year: 2026,
        status: 'ACTIVE',
        studentCount: 1500,
        passRate: 88.5
      },
      {
        id: 2,
        year: 2025,
        status: 'CLOSED',
        studentCount: 1400,
        passRate: 89.2
      }
    ]
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
    expect(cards.length).toBe(6);
    
    // Total Students Card
    expect(cards[0].title).toBe('Total estudiantes');
    expect(cards[0].value).toBe('1.500'); // BO Locale formatted
    expect(cards[0].variant).toBe('students');

    // Subjects without Teacher Card
    expect(cards[1].title).toBe('Materias sin docente');
    expect(cards[1].value).toBe('5');
    expect(cards[1].variant).toBe('subjects');

    // Open Actas Card
    expect(cards[2].title).toBe('Actas abiertas');
    expect(cards[2].value).toBe('10');
    expect(cards[2].variant).toBe('actas');
    
    // Approved Rate Card
    expect(cards[3].title).toBe('Índice aprobados');
    expect(cards[3].value).toBe('88,5%'); // BO Locale formatting for floats
    expect(cards[3].variant).toBe('approved');

    // Failed Rate Card
    expect(cards[4].title).toBe('Índice reprobados');
    expect(cards[4].value).toBe('11,5%');
    expect(cards[4].variant).toBe('failed');

    // Students at Risk Card
    expect(cards[5].title).toBe('Estudiantes en riesgo');
    expect(cards[5].value).toBe('173');
    expect(cards[5].variant).toBe('risk');
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

    // Reset calls to spy
    mockDashboardService.getSummary.mockClear();
    
    // Switch mock back to success
    mockDashboardService.getSummary.mockReturnValue(of(mockSummary));
    
    component.loadDashboard();
    fixture.detectChanges();

    expect(mockDashboardService.getSummary).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockSummary);
    expect(component.errorMessage()).toBeNull();
  });
});
