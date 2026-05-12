import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params: this.convertToHttpParams(params) });
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  patch<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`);
  }

  downloadBlob(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      responseType: 'blob',
    });
  }

  private convertToHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    return httpParams;
  }
}
