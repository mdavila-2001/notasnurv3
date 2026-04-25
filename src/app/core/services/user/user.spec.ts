import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { User } from './user';
import { environment } from '../../../../environments/environment';

describe('User', () => {
  let service: User;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        User,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(User);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch users by role', () => {
    const role = 'TEACHER';
    const mockUsers = [{ id: '1', fullName: 'Teacher 1', role }];

    service.getUsersByRole(role).subscribe((users) => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${apiUrl}/role/${role}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should create a user', () => {
    const userData = { fullName: 'New User', role: 'STUDENT' };
    const mockUser = { id: '2', ...userData };

    service.create(userData).subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockUser);
  });
});
