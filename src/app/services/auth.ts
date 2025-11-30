import { Injectable } from '@angular/core';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;

  private readonly USERS_KEY = 'mockUsers';
  private readonly CURRENT_USER_KEY = 'currentUser';

  constructor() {
    const storage = this.storage;
    if (storage) {
      const raw = storage.getItem(this.CURRENT_USER_KEY);
      if (raw) {
        this.currentUser = JSON.parse(raw);
      }
    }
  }

  // ---- Helpers for safe localStorage access (works with SSR too) ----
  private get storage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage ?? null;
  }

  private getUsers(): User[] {
    const storage = this.storage;
    if (!storage) {
      return [];
    }
    const raw = storage.getItem(this.USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveUsers(users: User[]): void {
    const storage = this.storage;
    if (!storage) return;
    storage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // ---- Public API ----

  // 👇 Register ONLY saves the user, does NOT log them in
  register(user: User): boolean {
    const users = this.getUsers();

    const exists = users.some(u => u.email === user.email);
    if (exists) {
      return false;
    }

    user.id = users.length + 1;
    users.push(user);
    this.saveUsers(users);

    // Do NOT set currentUser here: user must login manually
    return true;
  }

  // Login checks credentials against registered users
  login(email: string, password: string): boolean {
    const users = this.getUsers();

    const found = users.find(
      u => u.email === email && u.password === password
    );

    if (!found) {
      return false;
    }

    this.currentUser = found;

    const storage = this.storage;
    if (storage) {
      storage.setItem(this.CURRENT_USER_KEY, JSON.stringify(found));
    }

    return true;
  }

  logout(): void {
    this.currentUser = null;
    const storage = this.storage;
    if (storage) {
      storage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser != null;
  }
}
