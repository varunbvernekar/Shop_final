import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get token from AuthService
    const user = this.authService.getCurrentUser();
    let token = this.authService.getToken();

    // HARDCODED TOKENS FOR DEMO/TESTING
    const ADMIN_TOKEN = 'hardcoded-admin-jwt-token-12345';
    const CUSTOMER_TOKEN = 'hardcoded-customer-jwt-token-67890';

    if (user) {
      if (user.role === 'ADMIN') {
        token = ADMIN_TOKEN;
      } else if (user.role === 'CUSTOMER') {
        token = CUSTOMER_TOKEN;
      }
    }

    if (token) {
      // Clone request and attach Authorization header
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}
