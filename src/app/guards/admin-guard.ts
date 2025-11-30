// src/app/guards/admin-guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (user && user.role === 'ADMIN') {
    return true;
  }

  // Not an admin → send to login (or you could redirect to /products)
  return router.parseUrl('/login');
};
