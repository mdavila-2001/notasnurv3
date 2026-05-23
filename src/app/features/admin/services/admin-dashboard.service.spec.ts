import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { DashboardAdminBackendResponse, AdminDashboardApiEnvelope } from '../../../core/models/admin-dashboard.model';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        AdminDashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSummary', () => {
    it('should fetch and normalize dashboard metrics with direct response', () => {
      const mockBackendResponse: DashboardAdminBackendResponse = {
        totalStudents: 150,
        totalSubjectsWithoutTeacher: 5,
        totalOpenActas: 12,
        globalPassRate: 85.5,
        studentsAtRiskCount: 22,
        managements: [
          {
            id: 1,
            year: 2026,
            status: 'ACTIVE',
            studentCount: 150,
            passRate: 85.5
          }
        ]
      };

      service.getSummary().subscribe((summary) => {
        expect(summary.totalStudents).toBe(150);
        expect(summary.totalSubjectsWithoutTeacher).toBe(5);
        expect(summary.totalOpenActas).toBe(12);
        expect(summary.globalPassRate).toBe(85.5);
        expect(summary.globalFailRate).toBe(14.5); // 100 - 85.5
        expect(summary.studentsAtRiskCount).toBe(22);
        expect(summary.managements.length).toBe(1);
        expect(summary.managements[0].year).toBe(2026);
        expect(summary.managements[0].studentCount).toBe(150);
        expect(summary.managements[0].passRate).toBe(85.5);
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard/admin`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse);
    });

    it('should fetch and normalize dashboard metrics with API envelope response', () => {
      const mockEnvelope: AdminDashboardApiEnvelope = {
        success: true,
        message: 'Loaded successfully',
        data: {
          totalStudents: 200,
          totalSubjectsWithoutTeacher: 3,
          totalOpenActas: 8,
          globalPassRate: 90.0,
          studentsAtRiskCount: 15,
          managements: [
            {
              id: 2,
              year: 2025,
              status: 'CLOSED',
              studentCount: 180,
              passRate: 92.0
            }
          ]
        }
      };

      service.getSummary().subscribe((summary) => {
        expect(summary.totalStudents).toBe(200);
        expect(summary.totalSubjectsWithoutTeacher).toBe(3);
        expect(summary.totalOpenActas).toBe(8);
        expect(summary.globalPassRate).toBe(90.0);
        expect(summary.globalFailRate).toBe(10.0); // 100 - 90
        expect(summary.studentsAtRiskCount).toBe(15);
        expect(summary.managements.length).toBe(1);
        expect(summary.managements[0].status).toBe('CLOSED');
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard/admin`);
      req.flush(mockEnvelope);
    });

    it('should fallback to empty dashboard values if response is null or empty', () => {
      const mockEnvelope: AdminDashboardApiEnvelope = {
        success: true,
        message: 'Empty dashboard',
        data: null
      };

      service.getSummary().subscribe((summary) => {
        expect(summary.totalStudents).toBe(0);
        expect(summary.totalSubjectsWithoutTeacher).toBe(0);
        expect(summary.totalOpenActas).toBe(0);
        expect(summary.globalPassRate).toBe(0);
        expect(summary.globalFailRate).toBe(100); // 100 - 0
        expect(summary.studentsAtRiskCount).toBe(0);
        expect(summary.managements.length).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard/admin`);
      req.flush(mockEnvelope);
    });
  });
});
