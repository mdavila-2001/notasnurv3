import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectFormComponent } from './subject-form';
import { SubjectResponse, SubjectRequest } from '../../../core/models/subject.model';
import { SelectOption } from '../../../shared/components/input/input';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('SubjectFormComponent', () => {
  let component: SubjectFormComponent;
  let fixture: ComponentFixture<SubjectFormComponent>;

  const mockSemesterOptions: SelectOption[] = [
    { label: 'Semestre 1-2026', value: '1' },
    { label: 'Semestre 2-2026', value: '2' },
  ];

  const mockTeacherOptions: SelectOption[] = [
    { label: 'Docente Uno', value: 'docente-1' },
    { label: 'Docente Dos', value: 'docente-2' },
  ];

  const mockSubject: SubjectResponse = {
    id: '10',
    code: 'INF-101',
    name: 'Introducción a la Computación',
    modality: 'FACE_TO_FACE',
    capacity: 25,
    semesterId: '1',
    teacherId: 'docente-1',
    recordStatus: 'PUBLISHED',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectFormComponent);
    component = fixture.componentInstance;
    
    fixture.componentRef.setInput('semesterOptions', mockSemesterOptions);
    fixture.componentRef.setInput('teacherOptions', mockTeacherOptions);
    fixture.componentRef.setInput('subject', null);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values when no subject is provided', () => {
    expect(component.form.getRawValue()).toEqual({
      code: '',
      name: '',
      modality: '',
      capacity: null,
      semesterId: '',
      teacherId: '',
      recordStatus: 'DRAFT',
    });
    expect(component.codeControl.enabled).toBe(true);
    expect(component.isEditing).toBe(false);
  });

  it('should initialize form with subject details when subject is provided', async () => {
    fixture.componentRef.setInput('subject', mockSubject);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.form.getRawValue()).toEqual({
      code: 'INF-101',
      name: 'Introducción a la Computación',
      modality: 'FACE_TO_FACE',
      capacity: 25,
      semesterId: '1',
      teacherId: 'docente-1',
      recordStatus: 'PUBLISHED',
    });
    expect(component.codeControl.disabled).toBe(true);
    expect(component.isEditing).toBe(true);
  });

  it('should enable code control when resetting subject to null', async () => {
    fixture.componentRef.setInput('subject', mockSubject);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.codeControl.disabled).toBe(true);

    fixture.componentRef.setInput('subject', null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.codeControl.enabled).toBe(true);
  });

  it('should update form controls and mark as touched on value change methods', () => {
    component.onCodeChange('MAT-200');
    expect(component.codeControl.value).toBe('MAT-200');
    expect(component.codeControl.touched).toBe(true);

    component.onNameChange('Calculo I');
    expect(component.nameControl.value).toBe('Calculo I');
    expect(component.nameControl.touched).toBe(true);

    component.onModalityChange('ONLINE');
    expect(component.modalityControl.value).toBe('ONLINE');
    expect(component.modalityControl.touched).toBe(true);

    component.onCapacityChange('40');
    expect(component.capacityControl.value).toBe(40);
    expect(component.capacityControl.touched).toBe(true);

    component.onCapacityChange('invalid-number');
    expect(component.capacityControl.value).toBeNull();

    component.onSemesterChange('2');
    expect(component.semesterIdControl.value).toBe('2');
    expect(component.semesterIdControl.touched).toBe(true);

    component.onTeacherChange('docente-2');
    expect(component.teacherIdControl.value).toBe('docente-2');
    expect(component.teacherIdControl.touched).toBe(true);
  });

  it('should change recordStatus on valid status value change', () => {
    component.onRecordStatusValueChange('PUBLISHED');
    expect(component.recordStatusControl.value).toBe('PUBLISHED');
    expect(component.recordStatusControl.touched).toBe(true);

    component.onRecordStatusValueChange('INVALID_STATUS');
    expect(component.recordStatusControl.value).toBe('PUBLISHED');
  });

  it('should not emit save when form is invalid', () => {
    let emitted: SubjectRequest | null = null;
    component.save.subscribe(val => (emitted = val));

    component.onSubmit();

    expect(component.form.touched).toBe(true);
    expect(emitted).toBeNull();
  });

  it('should not emit save when modality is missing or capacity is null', () => {
    let emitted: SubjectRequest | null = null;
    component.save.subscribe(val => (emitted = val));

    component.form.patchValue({
      code: 'INF-101',
      name: 'Test Subject',
      modality: '',
      capacity: null,
      semesterId: '1',
      teacherId: 'docente-1',
      recordStatus: 'DRAFT',
    });

    component.onSubmit();
    expect(emitted).toBeNull();
  });

  it('should emit save with correct data when form is valid', () => {
    let emitted: SubjectRequest | null = null;
    component.save.subscribe(val => (emitted = val));

    component.form.patchValue({
      code: 'INF-101',
      name: 'Test Subject',
      modality: 'ONLINE',
      capacity: 35,
      semesterId: '1',
      teacherId: 'docente-1',
      recordStatus: 'ACTIVE',
    });

    component.onSubmit();

    expect(emitted).toEqual({
      code: 'INF-101',
      name: 'Test Subject',
      modality: 'ONLINE',
      capacity: 35,
      semesterId: 1,
      teacherId: 'docente-1',
      recordStatus: 'ACTIVE',
    });
  });

  it('should return early from onSubmit if getRawValue returns null capacity or empty modality despite form being valid', () => {
    let emitted: SubjectRequest | null = null;
    component.save.subscribe(val => (emitted = val));

    component.form.patchValue({
      code: 'INF-101',
      name: 'Test Subject',
      modality: 'ONLINE',
      capacity: 35,
      semesterId: '1',
      teacherId: 'docente-1',
      recordStatus: 'ACTIVE',
    });

    vi.spyOn(component.form, 'getRawValue').mockReturnValue({
      code: 'INF-101',
      name: 'Test Subject',
      modality: '',
      capacity: 35,
      semesterId: '1',
      teacherId: 'docente-1',
      recordStatus: 'ACTIVE' as any,
    });

    component.onSubmit();
    expect(emitted).toBeNull();
  });

  it('should emit cancel output when onCancel is called', () => {
    let cancelEmitted = false;
    component.cancel.subscribe(() => (cancelEmitted = true));

    component.onCancel();

    expect(cancelEmitted).toBe(true);
  });
});
