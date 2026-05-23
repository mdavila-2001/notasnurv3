import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AdminDashboardBackendResponse } from '../../../core/models/admin-dashboard.model';

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
    it('should fetch and normalize dashboard metrics with English property names', () => {
      const mockBackendResponse: AdminDashboardBackendResponse = {
        totalStudents: 150,
        activeSubjects: 12,
        approvedStudents: 120,
        failedStudents: 20,
        totalEvaluated: 140,
        approvedRate: 85.7,
        failedRate: 14.3,
        criticalSubjects: [
          {
            id: '10',
            code: 'MAT-200',
            name: 'Algebra',
            teacherName: 'Juan Perez',
            failureRate: 40.5,
            status: 'ACTIVA'
          }
        ],
        generatedAt: '2026-05-22T12:00:00'
      };

      service.getSummary().subscribe((summary) => {
        expect(summary.totalStudents).toBe(150);
        expect(summary.activeSubjects).toBe(12);
        expect(summary.approvedStudents).toBe(120);
        expect(summary.failedStudents).toBe(20);
        expect(summary.totalEvaluated).toBe(140);
        expect(summary.approvedRate).toBe(85.7);
        expect(summary.failedRate).toBe(14.3);
        expect(summary.criticalSubjects.length).toBe(1);
        expect(summary.criticalSubjects[0].code).toBe('MAT-200');
        expect(summary.criticalSubjects[0].failureRate).toBe(40.5);
        expect(summary.criticalSubjects[0].status).toBe('ACTIVA');
        expect(summary.generatedAt).toBe('2026-05-22T12:00:00');
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard/admin`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendResponse);
    });

    it('should normalize backend response using Spanish field variants', () => {
      const mockBackendResponse = {
        totalEstudiantes: 200,
        materiasActivas: 15,
        aprobados: 160,
        reprobados: 40,
        totalCalificados: 200,
        indiceAprobados: 0.8,
        indiceReprobados: 0.2,
        materiasCriticas: [
          {
            codigo: 'FIS-101',
            materia: 'Fisica',
            docente: 'Maria Lopez',
            tasaReprobacion: 48,
            estado: 'CERRADA'
          }
        ],
        generatedAt: '2026-05-22T18:00:00'
      };

      service.getSummary().subscribe((summary) => {
        expect(summary.totalStudents).toBe(200);
        expect(summary.activeSubjects).toBe(15);
        expect(summary.approvedStudents).toBe(160);
        expect(summary.failedStudents).toBe(40);
        expect(summary.approvedRate).toBe(80); // converted from 0.8
        expect(summary.failedRate).toBe(20); // converted from 0.2
        expect(summary.criticalSubjects.length).toBe(1);
        expect(summary.criticalSubjects[0].code).toBe('FIS-101');
        expect(summary.criticalSubjects[0].name).toBe('Fisica');
        expect(summary.criticalSubjects[0].teacherName).toBe('Maria Lopez');
        expect(summary.criticalSubjects[0].failureRate).toBe(48);
        expect(summary.criticalSubjects[0].status).toBe('CERRADA');
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard/admin`);
      req.flush(mockBackendResponse);
    });

    it('should fallback to mock critical subjects if response has empty subjects list', () => {
      const mockBackendResponse = {
        totalStudents: 100,
        activeSubjects: 5,
        criticalSubjects: []
      };

      service.getSummary().subscribe((summary) => {
        expect(summary.totalStudents).toBe(100);
        expect(summary.criticalSubjects.length).toBe(5);
        expect(summary.criticalSubjects[0].code).toBe('MAT-101'); // First mock
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard/admin`);
      req.flush(mockBackendResponse);
    });
  });
});
