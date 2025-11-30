// src/app/app.ts

import { Component } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { CartService } from './services/cart'; // 👈 added

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {

  constructor(
    private authService: AuthService,
    private router: Router,
    public cartService: CartService   // 👈 injected cart service
  ) {}

  get isLoggedIn(): boolean {
    return !!this.authService.getCurrentUser();
  }

  get isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return !!user && user.role === 'ADMIN';
  }

  // 👇 show current cart item count (used in navbar)
  get cartCount(): number {
    return this.cartService.getItemCount();
  }

  // 👇 navigate to cart view on Product page
  goToCart(): void {
    this.router.navigate(['/products'], { queryParams: { view: 'cart' } });
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clear();          // 👈 clear cart on logout (optional but clean)
    this.router.navigate(['/login']);
  }
}
