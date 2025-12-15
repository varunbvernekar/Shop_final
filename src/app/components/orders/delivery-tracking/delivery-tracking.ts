// src/app/components/customer/orders/delivery-tracking.ts

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../../models/order';
import { DeliveryService } from '../../../services/delivery';

@Component({
  selector: 'app-delivery-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delivery-tracking.html',
  styleUrls: ['./delivery-tracking.css']
})
export class DeliveryTracking {
  @Input() order: Order | null = null;

  orderSteps: OrderStatus[] = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

  private deliveryService = inject(DeliveryService);

  getTrackingUrl(carrier: string, trackingId: string): string {
    return this.deliveryService.getTrackingUrl(carrier, trackingId);
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
        return 'package_2';
    }
  }

  calculateEstimatedDelivery(order: Order | null): string {
    if (!order || !order.placedOn) return 'Pending';

    try {
      // Parse "DD/MM/YYYY" or fallback to standard date string
      const parts = order.placedOn.split('/');
      let date: Date;

      if (parts.length === 3) {
        date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        date = new Date(order.placedOn);
      }

      if (isNaN(date.getTime())) return 'Pending';

      // Add 8 days for estimated delivery
      date.setDate(date.getDate() + 8);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (e) {
      return 'Pending';
    }
  }

  getOrderId(order: Order | null): string {
    if (!order || !order.id) return 'ORD000';
    return `ORD${order.id.toString().padStart(3, '0')}`;
  }

  isStepCompleted(order: Order | null, step: string): boolean {
    if (!order) return false;
    const orderStates = this.orderSteps;
    return (
      orderStates.indexOf(step as OrderStatus) <=
      orderStates.indexOf(order.status)
    );
  }

  isCurrentStatus(order: Order | null, step: string): boolean {
    if (!order) return false;
    return order.status === (step as OrderStatus);
  }
}

