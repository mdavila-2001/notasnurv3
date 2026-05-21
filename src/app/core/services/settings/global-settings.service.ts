import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  GlobalSettingsResponse,
  StudentSubscriptionSettings
} from '../../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class GlobalSettingsService {
  private readonly api = inject(ApiService);

  getGlobalSettings(): Observable<GlobalSettingsResponse> {
    return this.api.get<GlobalSettingsResponse>('/settings/global').pipe(
      map(r => r.data)
    );
  }

  saveGlobalSettings(payload: GlobalSettingsResponse): Observable<GlobalSettingsResponse> {
    return this.api.post<GlobalSettingsResponse>('/settings/global', payload).pipe(
      map(r => r.data)
    );
  }

  getStudentSubscriptions(): Observable<StudentSubscriptionSettings> {
    return this.api.get<StudentSubscriptionSettings>('/settings/subscriptions').pipe(
      map(r => r.data)
    );
  }

  saveStudentSubscriptions(payload: StudentSubscriptionSettings): Observable<StudentSubscriptionSettings> {
    return this.api.post<StudentSubscriptionSettings>('/settings/subscriptions', payload).pipe(
      map(r => r.data)
    );
  }
}
