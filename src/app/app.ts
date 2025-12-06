// src/app/app.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { CartService } from './services/cart';
import { ProductService } from './services/product';
import { Subscription } from 'rxjs';
import { LowStockAlerts } from './components/admin/low-stock-alerts/low-stock-alerts';
import { CustomerNotifications } from './components/customer/notifications/customer-notifications';
import { Sidebar } from './components/shared/sidebar/sidebar';
import { OrderService } from './services/order';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LowStockAlerts, CustomerNotifications, Sidebar],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  lowStockCount = 0;
  showLowStockModal = false;
  notificationCount = 0;
  showNotificationsModal = false;
  private productsSubscription?: Subscription;
  private ordersSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public cartService: CartService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadLowStockCount();
    this.loadNotificationCount();
    
    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      // Listen for inventory updates to refresh low stock count
      window.addEventListener('inventoryUpdated', () => {
        this.loadLowStockCount();
      });

      // Listen for order updates to refresh notification count
      window.addEventListener('orderUpdated', () => {
        this.loadNotificationCount();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
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

  loadNotificationCount(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id || user.role !== 'CUSTOMER') {
      this.notificationCount = 0;
      return;
    }

    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }

    // Load read notifications from localStorage (only in browser)
    let readNotifications: Set<string> = new Set();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(`readNotifications_${user.id}`);
        if (stored) {
          readNotifications = new Set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load read notifications', e);
      }
    }

    this.ordersSubscription = this.orderService.getOrdersForUser(user.id).subscribe({
      next: orders => {
        // Count unread notifications (orders with status updates or shipment tracking info)
        let unreadCount = 0;
        orders.forEach(order => {
          if (!order.id) return;

          const hasStatusUpdate = order.status !== 'Confirmed';
          const hasTracking = order.logistics && 
                             order.logistics.trackingId && 
                             order.logistics.trackingId !== '-' && 
                             order.logistics.carrier !== 'Not assigned';

          if (hasStatusUpdate || hasTracking) {
            // Check if order notification is read
            const orderNotificationId = `order_${order.id}_${order.status}`;
            if (!readNotifications.has(orderNotificationId)) {
              unreadCount++;
            }

            // Check if shipment notification is read
            if (hasTracking && (order.status === 'Shipped' || order.status === 'Delivered')) {
              const shipmentNotificationId = `shipment_${order.id}`;
              if (!readNotifications.has(shipmentNotificationId)) {
                unreadCount++;
              }
            }
          }
        });

        this.notificationCount = unreadCount;
      },
      error: err => {
        console.error('Failed to load notification count', err);
        this.notificationCount = 0;
      }
    });
  }

  openNotifications(): void {
    this.showNotificationsModal = true;
  }

  closeNotifications(): void {
    this.showNotificationsModal = false;
    // Refresh notification count after closing modal (in case notifications were marked as read)
    this.loadNotificationCount();
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clear();
    this.router.navigate(['/login']);
  }
}
