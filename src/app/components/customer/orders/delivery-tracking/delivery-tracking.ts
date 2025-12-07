// src/app/components/customer/orders/delivery-tracking.ts

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderStatus } from '../../../../models/order';
import { DeliveryService } from '../../../../services/delivery';

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

