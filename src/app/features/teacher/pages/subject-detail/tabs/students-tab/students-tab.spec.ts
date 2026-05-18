import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

// Tu componente
import { StudentsTab } from './students-tab';

// El servicio operacional que debe ser mocked
import { SubjectOperationalService } from '../../../../../../core/services/subject-operational/subject-operational.service';

describe('StudentsTab', () => {
  let component: StudentsTab;
  let fixture: ComponentFixture<StudentsTab>;

  // Mock del SubjectOperationalService
  const mockSubjectOperationalService = {
    isLoading: signal(false),
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsTab],
      providers: [
        { provide: SubjectOperationalService, useValue: mockSubjectOperationalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsTab);
    component = fixture.componentInstance;
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

  it('should filter students based on search term', () => {
    fixture.detectChanges();
    component.updateSearch('Juan');
    const filtered = component.filteredStudents();
    expect(filtered.length).toBe(1);
    expect(filtered[0].fullName).toBe('Juan García');
  });
});
