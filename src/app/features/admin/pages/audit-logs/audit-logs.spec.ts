import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AuditLogs } from './audit-logs';
import { AdminAuditService, AuditLogsPageResponse } from '../../services/admin-audit.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';
import { ApiResponse, AuditLogResponse } from '../../../../core/models/api.models';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('AuditLogs Component', () => {
  let component: AuditLogs;
  let fixture: ComponentFixture<AuditLogs>;
  let mockAuditService: any;
  let mockToastService: any;

  const mockLog: AuditLogResponse = {
    id: 'log-1',
    userId: 'user-1',
    userFullName: 'Carlos Docente',
    userEmail: 'c.docente@nur.edu.bo',
    affectedTable: 'grade',
    recordId: 'record-123',
    oldValue: JSON.stringify({ score: 40, evaluationPlanId: 10 }),
    newValue: JSON.stringify({ score: 80, evaluationPlanId: 10 }),
    action: 'UPDATE',
    changedAt: '2026-06-27T12:00:00Z',
    ipAddress: '192.168.1.1'
  };

  const mockPageResponse: ApiResponse<AuditLogsPageResponse> = {
    success: true,
    message: 'Ok',
    data: {
      content: [mockLog],
      totalPages: 1,
      totalElements: 1,
      size: 20,
      number: 0
    }
  };

  beforeEach(() => {
    mockAuditService = {
      getAuditLogs: vi.fn().mockReturnValue(of(mockPageResponse))
    };
    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [AuditLogs],
      providers: [
        { provide: AdminAuditService, useValue: mockAuditService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogs);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load logs on init', () => {
    fixture.detectChanges();
    expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
    expect(component.logs()).toEqual([mockLog]);
    expect(component.totalElements()).toBe(1);
    expect(component.totalPages()).toBe(1);
  });

  it('should reset page and load logs on search', () => {
    fixture.detectChanges();
    component.currentPage.set(2);
    
    const mockEvent = { target: { value: 'Carlos' } } as any;
    component.onSearch(mockEvent);

    expect(component.searchQuery()).toBe('Carlos');
    expect(component.currentPage()).toBe(0);
    expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
  });

  it('should reset page and load logs on filter change', () => {
    fixture.detectChanges();
    component.currentPage.set(3);
    component.selectedAction.set('CREATE');
    component.onFilterChange();

    expect(component.currentPage()).toBe(0);
    expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
  });

  it('should clear filters and reload logs', () => {
    fixture.detectChanges();
    component.searchQuery.set('Test');
    component.selectedAction.set('DELETE');
    component.selectedTable.set('attendance');
    component.currentPage.set(2);

    component.clearFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.selectedAction()).toBe('');
    expect(component.selectedTable()).toBe('');
    expect(component.currentPage()).toBe(0);
    expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
  });

  it('should manage page navigation correctly', () => {
    fixture.detectChanges();
    component.totalPages.set(5);
    component.currentPage.set(2);

    component.setPage(3);
    expect(component.currentPage()).toBe(3);

    component.setPage(5);
    expect(component.currentPage()).toBe(3);

    component.setPage(-1);
    expect(component.currentPage()).toBe(3);
  });

  it('should open and close details modal', () => {
    expect(component.isDetailModalOpen()).toBeFalsy();
    expect(component.selectedLog()).toBeNull();

    component.openDetail(mockLog);
    expect(component.isDetailModalOpen()).toBeTruthy();
    expect(component.selectedLog()).toEqual(mockLog);

    component.closeDetail();
    expect(component.isDetailModalOpen()).toBeFalsy();
    expect(component.selectedLog()).toBeNull();
  });

  describe('getParsedDiffs computed property', () => {
    it('should return empty list when selectedLog is null', () => {
      component.selectedLog.set(null);
      expect(component.getParsedDiffs()).toEqual([]);
    });

    it('should parse UPDATE diffs properly, filtering out matching fields and formatting values', () => {
      component.selectedLog.set(mockLog);
      const diffs = component.getParsedDiffs();
      
      expect(diffs.length).toBe(1);
      expect(diffs[0]).toEqual({
        field: 'Calificación (Nota)',
        oldVal: '40',
        newVal: '80'
      });
    });

    it('should parse CREATE diffs showing "-" as old value', () => {
      const createLog: AuditLogResponse = {
        ...mockLog,
        action: 'CREATE',
        oldValue: null,
        newValue: JSON.stringify({ score: 90, modality: 'BLENDED' })
      };
      component.selectedLog.set(createLog);
      const diffs = component.getParsedDiffs();

      expect(diffs).toContainEqual({
        field: 'Calificación (Nota)',
        oldVal: '-',
        newVal: '90'
      });
      expect(diffs).toContainEqual({
        field: 'Modalidad de Materia',
        oldVal: '-',
        newVal: 'BLENDED'
      });
    });

    it('should parse DELETE diffs showing "-" as new value', () => {
      const deleteLog: AuditLogResponse = {
        ...mockLog,
        action: 'DELETE',
        oldValue: JSON.stringify({ score: 70 }),
        newValue: null
      };
      component.selectedLog.set(deleteLog);
      const diffs = component.getParsedDiffs();

      expect(diffs).toEqual([
        {
          field: 'Calificación (Nota)',
          oldVal: '70',
          newVal: '-'
        }
      ]);
    });
  });
});
