import { Injectable, signal, computed } from '@angular/core';

export interface SelectedSubject {
  id: string;
  name: string;
  code: string;
  modality: string;
  studentCount: number;
  semesterName: string;
}

@Injectable({ providedIn: 'root' })
export class SubjectContextService {
  private readonly _currentSubject = signal<SelectedSubject | null>(null);

  readonly currentSubject = computed(() => this._currentSubject());
  readonly hasSelectedSubject = computed(() => !!this._currentSubject());

  setSubject(subject: SelectedSubject) {
    this._currentSubject.set(subject);
  }

  resetContext() {
    this._currentSubject.set(null);
  }
}
