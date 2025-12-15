import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../models/order';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user';
import { FormsModule } from '@angular/forms';
import { DeliveryTracking } from './delivery-tracking/delivery-tracking';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DeliveryTracking],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class OrdersPage implements OnInit {
  orderSteps: OrderStatus[] = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

  orders: Order[] = [];
  selectedOrder: Order | null = null;

  isAdmin = false;
  currentUser: User | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // In SSR, currentUser will be null. Don't show error, just wait.
    if (!this.currentUser || !this.currentUser.id) {
      // this.errorMessage = 'You must be logged in to view orders.'; // Remove explicit error for SSR
      return;
    }

    this.isAdmin = this.currentUser.role === 'ADMIN';

    this.loadOrders();
  }

  private loadOrders(): void {
    if (!this.currentUser || !this.currentUser.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    const request$ = this.isAdmin
      ? this.orderService.getAllOrders()
      : this.orderService.getOrdersForUser(this.currentUser.id);

    request$.subscribe({
      next: orders => {
        this.orders = orders;
        this.selectedOrder = null; // Don't auto-select any order - user must click to view details
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to load orders', err);
        this.errorMessage = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // CUSTOMER VIEW HELPERS

  selectOrder(order: Order): void {
    if (this.isAdmin) return; // admin has separate UI
    this.selectedOrder = order;
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  cancelOrder(order: Order): void {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    // Optimistic update prevention - rely on service
    this.orderService.cancelOrder(order.id!).subscribe({
      next: (updatedOrder) => {
        alert('Order cancelled successfully.');
        // update local list
        const index = this.orders.findIndex(o => o.id === updatedOrder.id);
        if (index > -1) {
          this.orders[index] = updatedOrder;
        }
        if (this.selectedOrder?.id === updatedOrder.id) {
          this.selectedOrder = updatedOrder;
        }
      },
      error: (err) => {
        console.error('Failed to cancel order', err);
        alert(err.message || 'Failed to cancel order');
      }
    });
  }

  // ADMIN VIEW ACTIONS
  selectedAdminOrder: Order | null = null;

  viewAdminOrderDetails(order: Order): void {
    this.selectedAdminOrder = order;
  }

  closeAdminOrderDetails(): void {
    this.selectedAdminOrder = null;
  }

  isAdminOrderCancellable(order: Order): boolean {
    return order.status === 'Confirmed' || order.status === 'Packed';
  }

  onAdminStatusChange(order: Order, newStatus: OrderStatus): void {
    order.status = newStatus;
    this.saveAdminChanges(order);
  }

  onAdminLogisticsChange(order: Order): void {
    // called when "Save" button is clicked
    this.saveAdminChanges(order);
  }

  private saveAdminChanges(order: Order): void {
    const oldStatus = this.orders.find(o => o.id === order.id)?.status;
    this.orderService.updateOrder(order).subscribe({
      next: updated => {
        // update local list
        const index = this.orders.findIndex(o => o.id === updated.id);
        if (index > -1) {
          this.orders[index] = updated;
        }

        // Notify customer if status changed
        if (oldStatus && oldStatus !== updated.status) {
          this.notifyCustomer(updated);
        }

        // Dispatch event to refresh notification count (only in browser)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('orderUpdated'));
        }
      },
      error: err => {
        console.error('Failed to update order', err);
        alert('Failed to update order. Please try again.');
      }
    });
  }

  private notifyCustomer(order: Order): void {
    // In a real application, this would send an email or push notification
    // For now, we'll just log it and show a confirmation
    console.log(`Customer notification: Order #${order.id} status changed to ${order.status}`);
    alert(`Customer has been notified about order #${order.id
      } status change to ${order.status} `);
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case 'Confirmed':
        return 'schedule';
      case 'Packed':
        return 'package_2';
      case 'Shipped':
        return 'local_shipping';
      case 'Delivered':
        return 'check_circle';
      default:
        return 'assignment';
    }
  }

  getOrderId(order: Order): string {
    if (!order.id) return 'ORD000';
    return `ORD${order.id.toString().padStart(3, '0')} `;
  }
}
