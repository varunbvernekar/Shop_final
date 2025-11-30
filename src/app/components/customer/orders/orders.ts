import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type OrderStatus = 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered';

interface Order {
  id: string;
  placedOn: string;
  amount: number;
  status: OrderStatus;
  product: {
    name: string;
    image: string;
    color: string;
    size: string;
    material: string;
  };
  estimatedDelivery: string;
  carrier: string;
  trackingId: string;
  currentLocation: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class OrdersPage {
  // steps used in the timeline
  orderSteps: OrderStatus[] = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];

  orders: Order[] = [
    {
      id: 'ORD001',
      placedOn: '20/11/2025',
      amount: 129.99,
      status: 'Shipped',
      product: {
        name: 'Handcrafted Silver Ring',
        image: 'assets/images/orders/ring-image.jpg',
        color: 'Rose Gold',
        size: '7',
        material: '14K Gold'
      },
      estimatedDelivery: 'Friday, November 28, 2025',
      carrier: 'Delhivery',
      trackingId: 'SHIP001',
      currentLocation: 'Mumbai Distribution Center'
    },
    {
      id: 'ORD002',
      placedOn: '22/11/2025',
      amount: 55,
      status: 'Packed',
      product: {
        name: 'Artisan Ceramic Vase',
        image: 'assets/images/orders/macrane-image.jpg',
        color: 'Blue',
        size: 'Medium',
        material: 'Porcelain'
      },
      estimatedDelivery: 'Sunday, November 30, 2025',
      carrier: 'Shiprocket',
      trackingId: 'SHIP002',
      currentLocation: 'Warehouse - Bangalore'
    },
    {
      id: 'ORD003',
      placedOn: '15/11/2025',
      amount: 75,
      status: 'Delivered',
      product: {
        name: 'Custom Leather Wallet',
        image: 'https://via.placeholder.com/80x80?text=Wallet',
        color: 'Brown',
        size: 'Bifold',
        material: 'Genuine Leather'
      },
      estimatedDelivery: 'Tuesday, November 25, 2025',
      carrier: 'Delhivery',
      trackingId: 'SHIP003',
      currentLocation: 'Customer Location'
    },
    {
      id: 'ORD004',
      placedOn: '24/11/2025',
      amount: 165,
      status: 'Confirmed',
      product: {
        name: 'Pearl Necklace Set',
        image: 'https://via.placeholder.com/80x80?text=Pearl',
        color: 'White',
        size: '18 inch',
        material: 'Freshwater Pearl'
      },
      estimatedDelivery: 'Tuesday, December 2, 2025',
      carrier: 'Bluedart',
      trackingId: 'SHIP004',
      currentLocation: 'Warehouse - Mumbai'
    }
  ];

  selectedOrder: Order | null = this.orders[0];

  selectOrder(order: Order): void {
    this.selectedOrder = order;
  }

  // helpers for template – accept string coming from *ngFor
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
}
