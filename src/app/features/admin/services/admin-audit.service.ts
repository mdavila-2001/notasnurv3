import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, AuditLogResponse } from '../../../core/models/api.models';

export interface AuditLogsPageResponse {
  content: AuditLogResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class AdminAuditService {
  private readonly api = inject(ApiService);

  getAuditLogs(filters: {
    action?: string;
    affectedTable?: string;
    search?: string;
    page: number;
    size: number;
  }): Observable<ApiResponse<AuditLogsPageResponse>> {
    const params: Record<string, string | number> = {
      page: filters.page,
      size: filters.size
    };
    if (filters.action) params['action'] = filters.action;
    if (filters.affectedTable) params['affectedTable'] = filters.affectedTable;
    if (filters.search) params['search'] = filters.search;

    return this.api.get<AuditLogsPageResponse>('/audit-logs', params);
  }
}
