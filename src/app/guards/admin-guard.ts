// src/app/guards/admin-guard.ts

import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

  const authUser = authService.getCurrentUser();

  if (authUser && authUser.role === 'ADMIN') {
    return true;
  }

  // Not an admin → send to login (or you could redirect to /products)
  return router.parseUrl('/login');
};
