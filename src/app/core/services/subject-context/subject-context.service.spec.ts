import { TestBed } from '@angular/core/testing';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { SubjectContextService, SelectedSubject } from './subject-context.service';

describe('SubjectContextService', () => {
  let service: SubjectContextService;

  const mockSubject: SelectedSubject = {
    id: 'subj-123',
    name: 'Desarrollo Web II',
    code: 'WEB-200',
    modality: 'ONLINE',
    studentCount: 25,
    semesterName: 'Gestión 2026 - Semestre I'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubjectContextService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null subject initially and hasSelectedSubject as false', () => {
    expect(service.currentSubject()).toBeNull();
    expect(service.hasSelectedSubject()).toBe(false);
  });

  it('should set selected subject and hasSelectedSubject as true', () => {
    service.setSubject(mockSubject);
    expect(service.currentSubject()).toEqual(mockSubject);
    expect(service.hasSelectedSubject()).toBe(true);
  });

  it('should reset current subject context back to null', () => {
    service.setSubject(mockSubject);
    expect(service.currentSubject()).toEqual(mockSubject);

    service.resetContext();
    expect(service.currentSubject()).toBeNull();
    expect(service.hasSelectedSubject()).toBe(false);
  });
});
