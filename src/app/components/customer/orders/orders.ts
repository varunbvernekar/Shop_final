import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgLocalization } from '@angular/common';
import { Order, OrderStatus } from '../../../models/order';
import { OrderService } from '../../../services/order';
import { AuthService } from '../../../services/auth';
import { User } from '../../../models/user';
import { FormsModule, NgModel } from '@angular/forms';
import { DeliveryTracking } from './delivery-tracking';

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
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || !this.currentUser.id) {
      this.errorMessage = 'You must be logged in to view orders.';
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

  isStepCompleted(order: Order, step: string): boolean {
    const orderStates = this.orderSteps;
    return (
      orderStates.indexOf(step as OrderStatus) <=
      orderStates.indexOf(order.status)
    );
  }

  isCurrentStatus(order: Order, step: string): boolean {
    return order.status === (step as OrderStatus);
  }

  // ADMIN VIEW ACTIONS

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
    alert(`Customer has been notified about order #${order.id} status change to ${order.status}`);
  }

  getTrackingUrl(carrier: string, trackingId: string): string {
    // Fake integration - just provides a tracking link
    // In a real app, this would use the carrier's API
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('shiprocket') || carrierLower.includes('delhivery')) {
      return `https://www.shiprocket.in/tracking/${trackingId}`;
    } else if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingId}`;
    } else if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingId}`;
    } else if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingId}`;
    } else {
      // Generic tracking URL
      return `https://www.17track.net/en/track?nums=${trackingId}`;
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case 'Confirmed':
        return '🕐';
      case 'Packed':
        return '📦';
      case 'Shipped':
        return '🚚';
      case 'Delivered':
        return '✅';
      default:
        return '📦';
    }
  }

  formatDeliveryDate(dateStr: string): string {
    // Convert date format from "MM/DD/YYYY" to "Day, Month DD, YYYY"
    // This is a simple formatter - you might want to use a date library
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month - 1, day);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${day}, ${year}`;
    }
    return dateStr;
  }

  getOrderId(order: Order): string {
    if (!order.id) return 'ORD000';
    return `ORD${order.id.toString().padStart(3, '0')}`;
  }
}
