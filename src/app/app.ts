// src/app/app.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { CartService } from './services/cart';
import { ProductService } from './services/product';
import { Subscription } from 'rxjs';
import { LowStockAlerts } from './components/admin/low-stock-alerts/low-stock-alerts';
import { Sidebar } from './components/shared/sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LowStockAlerts, Sidebar],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  lowStockCount = 0;
  showLowStockModal = false;
  private productsSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public cartService: CartService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadLowStockCount();
    
    // Listen for inventory updates to refresh low stock count
    window.addEventListener('inventoryUpdated', () => {
      this.loadLowStockCount();
    });
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }

  loadLowStockCount(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    this.productsSubscription = this.productService.getProducts().subscribe({
      next: products => {
        this.lowStockCount = products.filter(
          p =>
            typeof p.stockLevel === 'number' &&
            typeof p.reorderThreshold === 'number' &&
            p.stockLevel <= p.reorderThreshold
        ).length;
      },
      error: err => {
        console.error('Failed to load low stock count', err);
      }
    });
  }

  // Method to refresh low stock count (can be called from other components)
  refreshLowStockCount(): void {
    this.loadLowStockCount();
  }

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


  openLowStockAlerts(): void {
    this.showLowStockModal = true;
  }

  closeLowStockAlerts(): void {
    this.showLowStockModal = false;
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clear();
    this.router.navigate(['/login']);
  }
}
