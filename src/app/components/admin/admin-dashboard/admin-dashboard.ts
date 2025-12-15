// src/app/components/admin/admin-dashboard/admin-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/product';
import { OrderService } from '../../../services/order';
import { Order } from '../../../models/order';

interface RepeatedProductReportItem {
  name: string;
  image: string;
  timesOrdered: number;
  totalQuantity: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  products: Product[] = [];
  activeProductsCount = 0;
  orders: Order[] = [];

  // demo stats
  totalOrders = 128;
  totalRevenue = 54230;
  avgOrderValue = 425;


  // Reports
  showReports = true;
  reportStartDate = '';
  reportEndDate = '';
  filteredOrders: Order[] = [];
  repeatedProductsReport: RepeatedProductReportItem[] = [];

  constructor(
    private productService: ProductService,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.refreshData();
    this.loadOrders();
  }

  refreshData(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;

        this.activeProductsCount = this.products.filter(
          p => p.isActive !== false
        ).length;
      },
      error: err => {
        console.error('Failed to load products in admin dashboard', err);
      }
    });
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.totalOrders = orders.length;
        this.totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
        this.avgOrderValue = orders.length > 0 ? this.totalRevenue / orders.length : 0;
        this.calculateRepeatedProducts();
      },
      error: err => {
        console.error('Failed to load orders', err);
      }
    });
  }




  // Reports


  filterReports(): void {
    if (!this.reportStartDate || !this.reportEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(this.reportStartDate);
    const end = new Date(this.reportEndDate);
    end.setHours(23, 59, 59, 999);

    this.filteredOrders = this.orders.filter(order => {
      const orderDate = this.parseDate(order.placedOn);
      return orderDate >= start && orderDate <= end;
    });
  }

  private parseDate(dateStr: string): Date {
    // Handle format like "3/12/2025"
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  }

  getReportRevenue(): number {
    return this.filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  }

  getReportOrderCount(): number {
    return this.filteredOrders.length;
  }

  private calculateRepeatedProducts(): void {
    const productMap = new Map<string, RepeatedProductReportItem>();

    this.orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          // Use name as key since productId might be inconsistent or missing in some legacy orders
          // ideally use productId, but name is safer for display aggregation if distinct
          const key = item.name;

          if (!productMap.has(key)) {
            productMap.set(key, {
              name: item.name,
              image: item.image,
              timesOrdered: 0,
              totalQuantity: 0,
              totalRevenue: 0
            });
          }

          const reportItem = productMap.get(key)!;
          reportItem.timesOrdered++;
          reportItem.totalQuantity += item.quantity;
          reportItem.totalRevenue += (item.price * item.quantity);
        });
      }
    });

    // Convert map to array and sort by times ordered (desc)
    this.repeatedProductsReport = Array.from(productMap.values())
      .sort((a, b) => b.timesOrdered - a.timesOrdered)
      // Only keep products ordered more than twice to be "repeated"
      .filter(item => item.timesOrdered > 2);
  }
}
