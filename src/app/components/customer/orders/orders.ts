import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgLocalization } from '@angular/common';
import { Order, OrderStatus } from '../../../models/order';
import { OrderService } from '../../../services/order';
import { AuthService } from '../../../services/auth';
import { User } from '../../../models/user';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule,FormsModule],
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
        this.selectedOrder = !this.isAdmin && orders.length > 0 ? orders[0] : null;
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
    this.orderService.updateOrder(order).subscribe({
      next: updated => {
        // update local list
        const index = this.orders.findIndex(o => o.id === updated.id);
        if (index > -1) {
          this.orders[index] = updated;
        }
      },
      error: err => {
        console.error('Failed to update order', err);
        alert('Failed to update order. Please try again.');
      }
    });
  }
}
