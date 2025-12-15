// src/app/app.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { CartService } from './services/cart';
import { ProductService } from './services/product';
import { Subscription } from 'rxjs';
import { LowStockAlerts } from './shared/components/low-stock-alerts/low-stock-alerts';
import { CustomerNotifications } from './shared/components/customer-notifications/customer-notifications';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { OrderService } from './services/order';

import { NotificationService } from './services/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LowStockAlerts, CustomerNotifications, Navbar, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  lowStockCount = 0;
  showLowStockModal = false;
  notificationCount = 0;
  showNotificationsModal = false;
  private productsSubscription?: Subscription;
  private notifSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public cartService: CartService,
    private productService: ProductService,
    private orderService: OrderService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadLowStockCount();

    // Subscribe to notification service
    this.notifSubscription = this.notificationService.unreadCount$.subscribe(
      count => this.notificationCount = count
    );

    // Initialize service with current user if logged in
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.notificationService.loadForUser(user.id);
    }

    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      // Listen for inventory updates to refresh low stock count
      window.addEventListener('inventoryUpdated', () => {
        this.loadLowStockCount();
      });

      // Order updates might now be handled by global polling or service logic
      // But keeping listener if needed, though NotificationService should auto-update if it polls
      // For now, let's ensure we reload if an event fires
      window.addEventListener('orderUpdated', () => {
        const u = this.authService.getCurrentUser();
        if (u?.id) this.notificationService.loadForUser(u.id); // Triggers reload
      });
    }
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.notifSubscription) {
      this.notifSubscription.unsubscribe();
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

  openNotifications(): void {
    this.showNotificationsModal = true;
  }

  closeNotifications(): void {
    this.showNotificationsModal = false;
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clear();
    this.notificationService.clear();
    this.router.navigate(['/login']);
  }
}
