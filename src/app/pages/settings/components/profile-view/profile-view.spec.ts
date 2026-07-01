import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileView } from './profile-view';
import { UserProfileResponse } from '../../../../core/models/api.models';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ProfileView', () => {
  let component: ProfileView;
  let fixture: ComponentFixture<ProfileView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileView]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compute user initials for multiple names', () => {
    const mockProfile: UserProfileResponse = {
      id: 'usr-1',
      ci: '123',
      fullName: 'Alejandro Prado',
      email: 'a.prado@nur.edu',
      role: 'TEACHER',
      status: 'ACTIVE'
    };
    
    fixture.componentRef.setInput('profile', mockProfile);
    fixture.detectChanges();

    expect(component.userInitials()).toBe('AP');
  });

  it('should compute initials for a single name', () => {
    const mockProfile: UserProfileResponse = {
      id: 'usr-2',
      ci: '456',
      fullName: 'Marcelo',
      email: 'm@nur.edu',
      role: 'STUDENT',
      status: 'ACTIVE'
    };

    fixture.componentRef.setInput('profile', mockProfile);
    fixture.detectChanges();

    expect(component.userInitials()).toBe('M');
  });

  it('should return default initial U if name is empty', () => {
    fixture.componentRef.setInput('profile', null);
    fixture.detectChanges();
    expect(component.userInitials()).toBe('U');

    fixture.componentRef.setInput('profile', { fullName: '' } as any);
    fixture.detectChanges();
    expect(component.userInitials()).toBe('U');
  });

  it('should show loader when isLoading is true', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();
    
    const loaderElement = fixture.nativeElement.querySelector('app-loader');
    expect(loaderElement).toBeTruthy();
  });
});
