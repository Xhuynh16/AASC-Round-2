import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const API_URL = 'http://localhost:3000';

export interface UserProfile {
  email?: string;
  name?: string;
  age?: number;
  nickname?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this._isLoggedIn.asObservable();

  constructor(private http: HttpClient) {}

  register(username: string, password: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/register`, { username, password });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ access_token: string }>(`${API_URL}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.access_token);
          this._isLoggedIn.next(true);
        })
      );
  }

  updateProfile(userData: UserProfile): Observable<any> {
    return this.http.put(`${API_URL}/user/update`, userData, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  getCurrentProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this._isLoggedIn.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
} 