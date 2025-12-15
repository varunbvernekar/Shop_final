import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderStatus } from '../../../models/order';
import { AuthService } from '../../../services/auth';
import { NotificationService, NotificationItem } from '../../../services/notification';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-notifications.html',
  styleUrls: ['./customer-notifications.css']
})
export class CustomerNotifications implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  notifications: NotificationItem[] = [];
  private notifSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.notifSubscription = this.notificationService.notifications$.subscribe(
      items => this.notifications = items
    );

    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.notificationService.loadForUser(user.id);
    }
  }

  ngOnDestroy(): void {
    if (this.notifSubscription) this.notifSubscription.unsubscribe();
  }

  markAsRead(notification: NotificationItem): void {
    this.notificationService.markAsRead(notification);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      'Confirmed': 'schedule',
      'Packed': 'package_2',
      'Shipped': 'local_shipping',
      'Delivered': 'check_circle',
      'Cancelled': 'cancel'
    };
    return icons[status] || 'assignment';
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      'Confirmed': '#3b82f6',
      'Packed': '#8b5cf6',
      'Shipped': '#f59e0b',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444'
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
}
