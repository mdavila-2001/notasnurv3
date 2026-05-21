import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GlobalSettingsService } from './global-settings.service';
import { environment } from '../../../../environments/environment';
import { GlobalSettingsResponse, StudentSubscriptionSettings } from '../../models/settings.model';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('GlobalSettingsService', () => {
  let service: GlobalSettingsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GlobalSettingsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GlobalSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Global Settings API', () => {
    const mockGlobalSettings: GlobalSettingsResponse = {
      academic: {
        minPassingGrade: 51,
        roundingType: 'CLASSIC_UP',
        globalGradesDeadline: '2026-07-15'
      },
      attendance: {
        maxAbsencesPresencial: 5,
        maxAbsencesSemiPresencial: 3
      },
      institutional: {
        pdfTemplateHeaderType: 'NUR_CLASSIC',
        allowLateGradesEntry: false
      }
    };

    it('should fetch global settings', () => {
      const mockResponse = { data: mockGlobalSettings, success: true, message: '' };

      service.getGlobalSettings().subscribe((settings) => {
        expect(settings).toEqual(mockGlobalSettings);
        expect(settings.academic.minPassingGrade).toBe(51);
      });

      const req = httpMock.expectOne(`${baseUrl}/settings/global`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should save global settings', () => {
      const mockResponse = { data: mockGlobalSettings, success: true, message: '' };

      service.saveGlobalSettings(mockGlobalSettings).subscribe((settings) => {
        expect(settings).toEqual(mockGlobalSettings);
      });

      const req = httpMock.expectOne(`${baseUrl}/settings/global`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockGlobalSettings);
      req.flush(mockResponse);
    });
  });

  describe('Student Subscriptions API', () => {
    const mockSubscriptions: StudentSubscriptionSettings = {
      emailAlertOnRisk: true
    };

    it('should fetch student subscriptions', () => {
      const mockResponse = { data: mockSubscriptions, success: true, message: '' };

      service.getStudentSubscriptions().subscribe((subs) => {
        expect(subs).toEqual(mockSubscriptions);
      });

      const req = httpMock.expectOne(`${baseUrl}/settings/subscriptions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should save student subscriptions', () => {
      const mockResponse = { data: mockSubscriptions, success: true, message: '' };

      service.saveStudentSubscriptions(mockSubscriptions).subscribe((subs) => {
        expect(subs).toEqual(mockSubscriptions);
      });

      const req = httpMock.expectOne(`${baseUrl}/settings/subscriptions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockSubscriptions);
      req.flush(mockResponse);
    });
  });
});
