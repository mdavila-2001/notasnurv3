import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';

// Tu componente
import { StudentsTabComponent } from './students-tab';

// Los servicios que necesitamos "burlar"
import { SubjectContextService } from '../../../../../../core/services/subject-context/subject-context.service';
import { EnrollmentApiService } from '../../../../../../features/teacher/services/enrollment-api.service';

describe('StudentsTabComponent', () => {
  let component: StudentsTabComponent;
  let fixture: ComponentFixture<StudentsTabComponent>;

  // 1. Creamos un servicio falso para el Contexto
  const mockSubjectContextService = {
    currentSubject: signal({ id: 'SUBJ-123', name: 'Sistemas Operativos' })
  };

  // 2. Creamos un servicio falso para la API (Versión a prueba de balas sin Jasmine/Jest)
  const mockEnrollmentApiService = {
    getStudentsBySubject: () => of({ data: [] })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsTabComponent],
      providers: [
        { provide: SubjectContextService, useValue: mockSubjectContextService },
        { provide: EnrollmentApiService, useValue: mockEnrollmentApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges(); 
    expect(component).toBeTruthy();
  });
});
