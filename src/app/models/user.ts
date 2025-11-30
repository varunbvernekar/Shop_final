export type UserRole = 'ADMIN' | 'VENDOR' | 'CUSTOMER';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string; // UI only; no real backend
  role: UserRole;
}
