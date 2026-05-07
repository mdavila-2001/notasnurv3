import { Injectable, signal, computed } from '@angular/core';
import { MySubject } from '../../models/my-subject.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectContextService {
  private readonly _currentSubject = signal<MySubject | null>(null);

  readonly currentSubject = computed(() => this._currentSubject());

  readonly hasSelectedSubject = computed(() => !!this._currentSubject());

  setSubject(subject: MySubject) {
    this._currentSubject.set(subject);
  }

  resetContext() {
    this._currentSubject.set(null);
  }
}