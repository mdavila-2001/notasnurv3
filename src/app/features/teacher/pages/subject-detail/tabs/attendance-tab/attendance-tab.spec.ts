import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceTab } from './attendance-tab';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { AttendanceService } from '../../../../services/attendance.service';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ActivatedRoute } from '@angular/router';

describe('AttendanceTab', () => {
  let component: AttendanceTab;
  let fixture: ComponentFixture<AttendanceTab>;
  let mockAttendanceService: any;
  let mockOperationalService: any;
  let mockToastService: any;

  const mockStudents = [
    {
      studentId: 'stud-1',
      enrollmentId: 'enroll-1',
      fullName: 'Juan Perez',
      ci: '12345',
      degreeName: 'Sistemas',
      photoUrl: ''
    }
  ];

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  beforeEach(async () => {
    TestBed.resetTestingModule();

    mockOperationalService = {
      isLoading: signal(false),
      students: signal([]),
      subject: signal({ id: 'subj-123', code: 'INF-320', name: 'Mobile' }),
      currentSubjectId: vi.fn().mockReturnValue('subj-123'),
      clearStore: vi.fn(),
      loadSubjectContext: vi.fn(),
    };

    mockAttendanceService = {
      attendanceDraft: signal([]),
      isReadyToSubmit: signal(true),
      date: signal('2026-05-20'),
      isSaving: signal(false),
      isDraftHydrating: signal(false),
      recordCounts: signal({ present: 1, late: 0, absent: 0, total: 1 }),
      error: signal(null),
      successMessage: signal(null),
      initializeDraft: vi.fn(),
      setDate: vi.fn(),
      updateStudentStatus: vi.fn(),
      submit: vi.fn().mockReturnValue(of(true))
    };

    mockToastService = {
      success: vi.fn(),
      error: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AttendanceTab],
      providers: [
        { provide: SubjectOperationalService, useValue: mockOperationalService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('subj-123')
              }
            },
            parent: {
              snapshot: {
                paramMap: {
                  get: vi.fn().mockReturnValue('subj-123')
                }
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger draft initialization when students are loaded', () => {
    mockOperationalService.students.set(mockStudents);
    fixture.detectChanges();
    
    expect(mockAttendanceService.initializeDraft).toHaveBeenCalledWith(mockStudents, 'subj-123');
  });

  it('should change date', () => {
    component.handleDateChange('2026-06-23');
    expect(mockAttendanceService.setDate).toHaveBeenCalledWith('2026-06-23');
  });

  it('should change status', () => {
    component.handleStatusChange('enroll-1', 'ABSENT');
    expect(mockAttendanceService.updateStudentStatus).toHaveBeenCalledWith('enroll-1', 'ABSENT');
  });

  describe('handleSubmit', () => {
    it('should submit successfully and display success toast', () => {
      component.handleSubmit();
      expect(mockAttendanceService.submit).toHaveBeenCalledWith('subj-123');
      expect(mockToastService.success).toHaveBeenCalled();
      expect(mockAttendanceService.setDate).toHaveBeenCalled();
    });

    it('should handle submit error', () => {
      mockAttendanceService.submit.mockReturnValue(throwError(() => new Error('Submit failed')));
      component.handleSubmit();
      expect(mockToastService.error).toHaveBeenCalledWith('Submit failed', 'Error al guardar');
    });

    it('should show toast error if subjectId cannot be resolved', () => {
      mockOperationalService.currentSubjectId.mockReturnValue(null);
      const route = TestBed.inject(ActivatedRoute);
      vi.spyOn(route.snapshot.paramMap, 'get').mockReturnValue(null);
      if (route.parent) {
        vi.spyOn(route.parent.snapshot.paramMap, 'get').mockReturnValue(null);
      }
      
      component.handleSubmit(); 
      expect(mockToastService.error).toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    it('should return correct color variants for absences', () => {
      expect(component.absenceBadgeColor(0)).toBe('success');
      expect(component.absenceBadgeColor(3)).toBe('warning');
      expect(component.absenceBadgeColor(6)).toBe('danger');
    });

    it('should label absences count correctly', () => {
      expect(component.absenceLabel(1)).toBe('1 Falta');
      expect(component.absenceLabel(4)).toBe('4 Faltas');
    });

    it('should return correct status chip variant and class', () => {
      expect(component.statusVariant('PRESENT', 'ABSENT')).toBe('tertiary');
      expect(component.statusVariant('ABSENT', 'ABSENT')).toBe('absent');
      expect(component.statusVariant('PRESENT', 'PRESENT')).toBe('present');
      expect(component.statusVariant('JUSTIFIED', 'JUSTIFIED')).toBe('justified');

      expect(component.statusClass('PRESENT', 'PRESENT')).toContain('active');
      expect(component.statusClass('PRESENT', 'ABSENT')).not.toContain('active');
    });

    it('should return row tone based on absences', () => {
      expect(component.rowTone(0)).toBe('attendance-row--success');
      expect(component.rowTone(2)).toBe('attendance-row--warning');
      expect(component.rowTone(6)).toBe('attendance-row--danger');
    });

    it('should format initials', () => {
      expect(component.initials('Orlando Almagro')).toBe('OA');
      expect(component.initials('Maria')).toBe('M');
    });
  });
});
