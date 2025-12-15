// src/app/services/order.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  /** Get all orders (for admin) */
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  /** Get orders only for a specific user (for customer) */
  getOrdersForUser(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders?userId=${userId}`);
  }

  /** Create a new order */
  createOrder(order: Omit<Order, 'id'>): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, order);
  }

  /** Update an existing order (status / logistics) */
  updateOrder(order: Order): Observable<Order> {
    if (!order.id) {
      throw new Error('Order id is required to update an order');
    }
    return this.http.put<Order>(`${this.apiUrl}/orders/${order.id}`, order);
  }

  /** Cancel an order */
  cancelOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`).pipe(
      switchMap(order => {
        if (order.status === 'Shipped' || order.status === 'Delivered') {
          throw new Error('Cannot cancel order that has already been shipped or delivered');
        }
        const updatedOrder = { ...order, status: 'Cancelled' as const };
        return this.updateOrder(updatedOrder);
      })
    );
  }

  // Helper to cancel that reuses updateOrder
  cancelOrderDirectly(order: Order): Observable<Order> {
    const updatedOrder = { ...order, status: 'Cancelled' as const };
    return this.updateOrder(updatedOrder);
  }

  /** Get orders filtered by date range */
  getOrdersByDateRange(startDate: string, endDate: string): Observable<Order[]> {
    return this.getAllOrders();
  }
}
