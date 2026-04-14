import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class User {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8081/api/users';

  getUsersByRole(role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/role/${role}`);
  }

  create(userData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, userData);
  }

update(id: string, userData: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${id}`, userData);
}

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}