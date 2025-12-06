// src/app/components/customer/notifications/customer-notifications.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Order, OrderStatus } from '../../../models/order';
import { OrderService } from '../../../services/order';
import { AuthService } from '../../../services/auth';
import { Subscription } from 'rxjs';

export interface NotificationItem {
  orderId: number;
  orderNumber: string;
  orderName: string; // First product name from order
  status: OrderStatus;
  message: string;
  timestamp: string;
  type: 'order' | 'shipment';
  read: boolean;
  logistics?: {
    carrier: string;
    trackingId: string;
    currentLocation: string;
  };
}

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-notifications.html',
  styleUrls: ['./customer-notifications.css']
})
export class CustomerNotifications implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  notifications: NotificationItem[] = [];
  private ordersSubscription?: Subscription;
  private readNotifications: Set<string> = new Set(); // Store read notification IDs

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReadNotifications();
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  private loadReadNotifications(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) return;
    
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(`readNotifications_${user.id}`);
      if (stored) {
        try {
          this.readNotifications = new Set(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to load read notifications', e);
        }
      }
    }
  }

  private saveReadNotifications(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) return;
    
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`readNotifications_${user.id}`, JSON.stringify(Array.from(this.readNotifications)));
    }
  }

  ngOnDestroy(): void {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) {
      return;
    }

    this.ordersSubscription = this.orderService.getOrdersForUser(user.id).subscribe({
      next: orders => {
        this.notifications = this.processOrdersToNotifications(orders);
      },
      error: err => {
        console.error('Failed to load notifications', err);
      }
    });
  }

  private processOrdersToNotifications(orders: Order[]): NotificationItem[] {
    const notifications: NotificationItem[] = [];

    orders.forEach(order => {
      if (!order.id) return;

      // Get first product name from order items
      const orderName = order.items && order.items.length > 0 
        ? order.items[0].name 
        : 'Order';

      // Check for order status updates
      const statusMessages: Record<OrderStatus, string> = {
        'Confirmed': 'Your order has been confirmed and is being prepared.',
        'Packed': 'Your order has been packed and is ready for shipment.',
        'Shipped': 'Your order has been shipped and is on its way!',
        'Delivered': 'Your order has been delivered successfully!'
      };

      // Create unique notification ID
      const orderNotificationId = `order_${order.id}_${order.status}`;
      const shipmentNotificationId = `shipment_${order.id}`;

      // Add notification for current status
      notifications.push({
        orderId: order.id,
        orderNumber: `#ORD-${order.id.toString().padStart(6, '0')}`,
        orderName: orderName,
        status: order.status,
        message: statusMessages[order.status] || 'Your order status has been updated.',
        timestamp: order.placedOn,
        type: 'order',
        read: this.readNotifications.has(orderNotificationId),
        logistics: order.logistics
      });

      // Add shipment notification if order is shipped or delivered
      if (order.status === 'Shipped' || order.status === 'Delivered') {
        if (order.logistics && order.logistics.trackingId && order.logistics.trackingId !== '-') {
          notifications.push({
            orderId: order.id,
            orderNumber: `#ORD-${order.id.toString().padStart(6, '0')}`,
            orderName: orderName,
            status: order.status,
            message: `Shipment update: ${order.logistics.currentLocation || 'In transit'}`,
            timestamp: order.placedOn,
            type: 'shipment',
            read: this.readNotifications.has(shipmentNotificationId),
            logistics: order.logistics
          });
        }
      }
    });

    // Sort by order ID (most recent first)
    return notifications.sort((a, b) => b.orderId - a.orderId);
  }

  markAsRead(notification: NotificationItem): void {
    if (notification.read) return;

    // Create unique notification ID
    const notificationId = notification.type === 'order' 
      ? `order_${notification.orderId}_${notification.status}`
      : `shipment_${notification.orderId}`;

    this.readNotifications.add(notificationId);
    notification.read = true;
    this.saveReadNotifications();
  }

  getStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      'Confirmed': '✅',
      'Packed': '📦',
      'Shipped': '🚚',
      'Delivered': '🎉'
    };
    return icons[status] || '📋';
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      'Confirmed': '#3b82f6',
      'Packed': '#8b5cf6',
      'Shipped': '#f59e0b',
      'Delivered': '#10b981'
    };
    return colors[status] || '#6b7280';
  }

  close(): void {
    this.closeEvent.emit();
  }

  goToOrders(): void {
    this.close();
    this.router.navigate(['/orders']);
  }

  get notificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

