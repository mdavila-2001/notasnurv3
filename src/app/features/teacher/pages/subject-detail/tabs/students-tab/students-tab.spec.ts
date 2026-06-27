import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { StudentsTab } from './students-tab';
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

describe('StudentsTab', () => {
  let component: StudentsTab;
  let fixture: ComponentFixture<StudentsTab>;
  let mockSubjectOperationalService: any;

  beforeEach(async () => {
    mockSubjectOperationalService = {
      isLoading: signal(false),
      subject: signal<any>({ id: 101 }),
      loadSubjectContext: vi.fn(),
      students: signal([
        {
          studentId: 'std-1',
          fullName: 'Juan García',
          ci: '1234567',
          email: 'juan@example.com',
          degreeName: 'Ingeniería Informática'
        },
        {
          studentId: 'std-2',
          fullName: 'María López',
          ci: '7654321',
          email: 'maria@example.com',
          degreeName: 'Ingeniería Informática'
        }
      ])
    };

    await TestBed.configureTestingModule({
      imports: [StudentsTab],
      providers: [
        { provide: SubjectOperationalService, useValue: mockSubjectOperationalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsTab);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display students from the operational service', () => {
    fixture.detectChanges();
    const students = component.students();
    expect(students).toBeDefined();
    expect(students.length).toBe(2);
  });

  it('should filter students based on name search term', () => {
    fixture.detectChanges();
    component.updateSearch('Juan');
    const filtered = component.filteredStudents();
    expect(filtered.length).toBe(1);
    expect(filtered[0].fullName).toBe('Juan García');
  });

  it('should filter students based on CI search term', () => {
    fixture.detectChanges();
    component.updateSearch('7654321');
    const filtered = component.filteredStudents();
    expect(filtered.length).toBe(1);
    expect(filtered[0].fullName).toBe('María López');
  });

  it('should return all students if search term is empty', () => {
    fixture.detectChanges();
    component.updateSearch('');
    const filtered = component.filteredStudents();
    expect(filtered.length).toBe(2);
  });

  it('should call loadSubjectContext on refreshList if subject is present', () => {
    fixture.detectChanges();
    component.refreshList();
    expect(mockSubjectOperationalService.loadSubjectContext).toHaveBeenCalledWith('101');
  });

  it('should not call loadSubjectContext on refreshList if subject is null', () => {
    mockSubjectOperationalService.subject.set(null);
    fixture.detectChanges();
    component.refreshList();
    expect(mockSubjectOperationalService.loadSubjectContext).not.toHaveBeenCalled();
  });

  it('should show loader when isLoading is true', () => {
    mockSubjectOperationalService.isLoading.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-loader')).toBeTruthy();
  });

  it('should show empty state when there are no students', () => {
    mockSubjectOperationalService.students.set([]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('No hay estudiantes inscritos');

    // Click refresh button in empty state
    const refreshBtn = compiled.querySelector('app-button') as HTMLElement;
    refreshBtn.click();
    expect(mockSubjectOperationalService.loadSubjectContext).toHaveBeenCalled();
  });

  it('should show sin resultados when search returns no match', () => {
    fixture.detectChanges();
    component.updateSearch('NonExistentName');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Sin resultados');

    // Clear search click
    const clearBtn = compiled.querySelector('app-button') as HTMLElement;
    clearBtn.click();
    fixture.detectChanges();
    expect(component.searchTerm()).toBe('');
  });
});
