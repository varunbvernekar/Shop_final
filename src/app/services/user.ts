// src/app/services/user.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /** Get user by ID */
  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  /** Update user profile */
  updateUser(user: User): Observable<User> {
    if (!user.id) {
      throw new Error('User id is required to update a user');
    }
    return this.http.put<User>(`${this.apiUrl}/users/${user.id}`, user);
  }
}

